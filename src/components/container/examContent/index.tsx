import './index.scss'
import stores from '@/stores'
import { observer } from 'mobx-react'
import { useCallback, useEffect, useState, useRef } from 'react';
import { Input } from 'antd';

import ListenQuestions from '@/components/basic/listenQuestions';
import ReadQuestions from '@/components/basic/readQuestions'
import WritteQuestions from '@/components/basic/writteQuestions';
import { useEventListener } from '@/hooks/core/useEventListener';

const { TextArea } = Input;

type HighlightRange = {
  id: string;
  text: string;
  note: string;
  examTitle: string;
}

type propType = {
  type: string;
};

export function clearExamHighlights(paperId: number, examTitle: string) {
  const key = `exam-highlights-${paperId}`;
  try {
    const allHighlights = JSON.parse(localStorage.getItem(key) || '[]');
    // 清除指定题目的高亮，保留其他题目
    const filtered = allHighlights.filter((h: HighlightRange) => h.examTitle !== examTitle);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (e) {
    console.error('清除笔记失败:', e);
  }
}

  // 动态获取 storage key，确保 paperId 变化时能正确读取
  const getHighlightKey = () => `exam-highlights-${stores.ExamStore.paperId}`;

const ExamContent = observer((props: propType) => {
  const { type } = props;

  const [selectedText, setSelectedText] = useState<string>('');
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [noteVisible, setNoteVisible] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [currentHighlightId, setCurrentHighlightId] = useState<string | null>(null);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);

  const [fontSize, setFontSize] = useState(stores.ExamStore.FontSize);
  const containerRef = useRef<HTMLDivElement>(null);

  const [boxPosition, setBoxPosition] = useState({ x: window.innerWidth - 320, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  useEffect(() => {
    setFontSize(stores.ExamStore.FontSize);
  },[stores.ExamStore.FontSize]);

  // 持久化笔记到 localStorage（合并所有 Part 的高亮）
  const persistHighlights = useCallback((currentHighlights: HighlightRange[]) => {
    try {
      const saved = localStorage.getItem(getHighlightKey());
      const allHighlights: HighlightRange[] = saved ? JSON.parse(saved) : [];

      // 移除当前 Part 的旧高亮，保留其他 Part 的
      const otherPartHighlights = allHighlights.filter(h => h.examTitle !== stores.ExamStore.currentExamTitle);

      // 合并新高亮
      const updated = [...otherPartHighlights, ...currentHighlights];
      localStorage.setItem(getHighlightKey(), JSON.stringify(updated));
    } catch (e) {
      console.error('保存笔记失败:', e);
    }
  }, []);

  // 直接在 DOM 上应用单个高亮
  const applyHighlightToDOM = useCallback((highlight: HighlightRange) => {
    const container = containerRef.current;
    if (!container || !highlight.text) return;

    console.log('[Highlight] 开始查找:', JSON.stringify(highlight.text.substring(0, 50)));

    // 直接在 container 下遍历所有文本节点
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node: Text | null;
    while (node = walker.nextNode() as Text) {
      if (node.parentElement?.closest('mark[data-highlight-id]')) continue;
      if (node.parentElement?.closest('.menuBox') || node.parentElement?.closest('.note')) continue;
      textNodes.push(node);
    }

    console.log('[Highlight] 找到文本节点数:', textNodes.length);

    // 尝试在多个节点中查找连续匹配
    const highlightText = highlight.text;
    let matchStart = -1;
    let matchEnd = -1;
    let currentPos = 0;
    let firstMatchNode: Text | null = null;

    // 先尝试找到匹配的起始节点
    for (let i = 0; i < textNodes.length; i++) {
      const text = textNodes[i].textContent || '';
      const idx = text.indexOf(highlightText);

      if (idx !== -1) {
        // 找到了完整匹配
        firstMatchNode = textNodes[i];
        matchStart = idx;
        matchEnd = idx + highlightText.length;
        break;
      }
    }

    // 如果找到完整匹配，直接高亮
    if (firstMatchNode) {
      console.log('[Highlight] 找到完整匹配');

      const parent = firstMatchNode.parentNode;
      if (!parent) {
        console.log('[Highlight] 失败: parent为null');
        return;
      }

      const before = firstMatchNode.textContent?.substring(0, matchStart) || '';
      const matched = firstMatchNode.textContent?.substring(matchStart, matchEnd) || '';
      const after = firstMatchNode.textContent?.substring(matchEnd) || '';

      console.log('[Highlight] 准备替换:', { before: before.substring(0, 30), matched: matched.substring(0, 30), after: after.substring(0, 30) });

      // 创建替换片段
      const wrapper = document.createElement('span');
      wrapper.className = 'highlight-wrapper';

      if (before) {
        const beforeNode = document.createTextNode(before);
        wrapper.appendChild(beforeNode);
      }

      const mark = document.createElement('mark');
      mark.setAttribute('data-highlight-id', highlight.id);
      mark.className = 'highlight-mark';
      mark.style.cssText = 'background-color: rgb(246, 238, 11) !important; opacity: 1 !important; color: #000 !important; display: inline !important; padding: 0 2px; border-radius: 2px; cursor: pointer;';
      mark.textContent = matched;
      wrapper.appendChild(mark);

      if (after) {
        const afterNode = document.createTextNode(after);
        wrapper.appendChild(afterNode);
      }

      // 用 wrapper 替换原节点
      parent.replaceChild(wrapper, firstMatchNode);

      // 验证
      console.log('[Highlight] 替换后parent.innerHTML:', parent.innerHTML.substring(0, 200));
      return;
    }

    // 没找到完整匹配，尝试分段匹配（跨节点情况）
    console.log('[Highlight] 未找到完整匹配，尝试分段匹配');

    // 连接所有文本节点内容来搜索
    const fullText = textNodes.map(n => n.textContent || '').join('\n');
    const searchIdx = fullText.indexOf(highlightText);

    if (searchIdx === -1) {
      // 文本完全不匹配，可能是空格/换行差异，尝试模糊匹配
      console.log('[Highlight] 精确匹配失败，尝试模糊匹配');

      const escaped = highlightText.replace(/\s+/g, '\\s+').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');

      for (const textNode of textNodes) {
        const text = textNode.textContent || '';
        if (!regex.test(text)) continue;

        regex.lastIndex = 0;
        const match = regex.exec(text);
        if (!match) continue;

        console.log('[Highlight] 模糊匹配成功在节点:', text.substring(0, 80));

        const parent = textNode.parentNode;
        if (!parent) continue;

        const before = text.substring(0, match.index);
        const matched = match[0];
        const after = text.substring(match.index + matched.length);

        const wrapper = document.createElement('span');
        wrapper.className = 'highlight-wrapper';

        if (before) wrapper.appendChild(document.createTextNode(before));

        const mark = document.createElement('mark');
        mark.setAttribute('data-highlight-id', highlight.id);
        mark.className = 'highlight-mark';
        mark.style.cssText = 'background-color: rgb(246, 238, 11) !important; opacity: 1 !important; color: #000 !important; display: inline !important; padding: 0 2px; border-radius: 2px; cursor: pointer;';
        mark.textContent = matched;
        wrapper.appendChild(mark);

        if (after) wrapper.appendChild(document.createTextNode(after));

        parent.replaceChild(wrapper, textNode);
        console.log('[Highlight] 模糊匹配高亮成功, innerHTML:', parent.innerHTML.substring(0, 150));
        return;
      }

      console.log('[Highlight] 所有匹配都失败');
      // 打印前几个节点帮助调试
      textNodes.slice(0, 5).forEach((tn, i) => {
        console.log(`[Highlight] 节点${i}:`, JSON.stringify(tn.textContent?.substring(0, 60)));
      });
    }
  }, []);

  // 清除 DOM 中所有高亮
  const clearHighlightsFromDOM = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const marks = container.querySelectorAll('mark.highlight-mark');
    marks.forEach(mark => {
      const text = mark.textContent || '';
      mark.parentNode?.replaceChild(document.createTextNode(text), mark);
    });
  }, []);

  // 重新应用所有高亮到 DOM
  const reapplyAllHighlights = useCallback(() => {
    clearHighlightsFromDOM();
    // 使用 setTimeout 确保 DOM 已经更新
    setTimeout(() => {
      highlights.forEach(h => applyHighlightToDOM(h));
    }, 0);
  }, [highlights, clearHighlightsFromDOM, applyHighlightToDOM]);

  // 题目切换时，恢复高亮
  useEffect(() => {
    setMenuVisible(false);
    setNoteVisible(false);
    setCurrentHighlightId(null);
    setSelectedText('');
    setNoteText('');

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    // 恢复当前题目的笔记
    const saved = localStorage.getItem(getHighlightKey());
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const currentHighlights: HighlightRange[] = parsed.filter((h: HighlightRange) => h.examTitle === stores.ExamStore.currentExamTitle);
        setHighlights(currentHighlights);
        // 延迟应用高亮，确保 DOM 已渲染
        setTimeout(() => {
          // 先清除旧高亮
          clearHighlightsFromDOM();
          // 再应用新高亮
          currentHighlights.forEach(h => applyHighlightToDOM(h));
        }, 100);
      } catch (e) {
        console.error('恢复笔记失败:', e);
        setHighlights([]);
      }
    } else {
      setHighlights([]);
      // 清除 DOM 中的高亮
      setTimeout(() => clearHighlightsFromDOM(), 0);
    }
  }, [stores.ExamStore.currentExamIndex, stores.ExamStore.currentExamTitle, type]);

  useEffect(() => {
    return () => {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    };
  }, []);

  const handleSelection = () => {
    if(noteVisible) return;
    const selection = window.getSelection();
    if (selection?.toString().length) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMenuPosition({ x: rect.left + window.scrollX, y: rect.bottom + window.scrollY });
        setSelectedText(selection.toString());
        setSelectionRange(range.cloneRange());
        setMenuVisible(true);
        setCurrentHighlightId(null);
    }
  };

  const handleCloseMenu = useCallback((e: MouseEvent) => {
    // 如果点击的是菜单或笔记区域，不关闭
    const target = e.target as HTMLElement;
    if (target.closest('.menuBox') || target.closest('.note') || target.closest('button')) {
      return;
    }

    const selection = window.getSelection();
    // 只有在没有选中文本时才关闭菜单
    if (!selection?.toString().length) {
      setMenuVisible(false);
      setCurrentHighlightId(null);
      setNoteVisible(false);
    }
  },[]);


  useEventListener('mouseup', handleSelection, document);
  useEventListener('click',handleCloseMenu, document);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      setBoxPosition({
        x: dragState.current.startPosX + dx,
        y: dragState.current.startPosY + dy
      });
    };
    
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.note-content')) {
      return;
    }
    setIsDragging(true);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: boxPosition.x,
      startPosY: boxPosition.y
    };
  };

  const handleNoteText = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNoteText(e.target.value);
  }

  const handleHighlight = () => {
    if (!selectionRange || !selectedText) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const newHighlight: HighlightRange = {
      id: Date.now().toString(),
      text: selectedText,
      note: '',
      examTitle: stores.ExamStore.currentExamTitle
    };

    // 1. 先保存选择并清除
    const selectedTextCopy = selectedText;
    if (selection) {
      selection.removeAllRanges();
    }

    // 2. 隐藏菜单
    setMenuVisible(false);

    // 3. 更新状态
    setHighlights(prev => {
      const updated = [...prev, newHighlight];
      persistHighlights(updated);
      return updated;
    });

    // 4. 延迟后应用高亮到 DOM（等待 React 完成渲染）
    setTimeout(() => {
      applyHighlightToDOM(newHighlight);
    }, 50);
  }

  const handleNote = () => {
    setNoteVisible(true);
  }

  const handleBlur = () => {
    if(noteText.length === 0) {
      handleClear();
      return;
    }

    if (currentHighlightId) {
      setHighlights(prev => {
        const updated = prev.map(h =>
          h.id === currentHighlightId ? {...h, note: noteText} : h
        );
        persistHighlights(updated);
        return updated;
      });
    } else {
      if (selectionRange && selectedText) {
        const newHighlight: HighlightRange = {
          id: Date.now().toString(),
          text: selectedText,
          note: noteText,
          examTitle: stores.ExamStore.currentExamTitle
        };
        setHighlights(prev => {
          const updated = [...prev, newHighlight];
          persistHighlights(updated);
          return updated;
        });
        applyHighlightToDOM(newHighlight);
      }
    }

    setNoteText('');
    setNoteVisible(false);
    setMenuVisible(false);
  }

  const handleClear = (id?: string) => {
    const targetId = id || currentHighlightId;
    if (targetId) {
      const container = containerRef.current;
      if (container) {
        const marks = container.querySelectorAll(`mark[data-highlight-id="${targetId}"]`);
        marks.forEach(mark => {
          const text = mark.textContent || '';
          mark.parentNode?.replaceChild(document.createTextNode(text), mark);
        });
      }

      setHighlights(prev => {
        const updated = prev.filter(h => h.id !== targetId);
        persistHighlights(updated);
        return updated;
      });
    }
    setMenuVisible(false);
    setNoteVisible(false);
    setCurrentHighlightId(null);
    setNoteText('');
  }

  const handleClearAll = () => {
    clearHighlightsFromDOM();
    setHighlights([]);
    persistHighlights([]);
    setMenuVisible(false);
    setNoteVisible(false);
    setCurrentHighlightId(null);
    setNoteText('');
  }

  const handleNoteClose = () => {
    setNoteVisible(false);
  }

  return (
    <div className='pageContent'>
      <div className='title'>
        <div className='title-part'>{stores.ExamStore.currentExamTitle}</div>
        {stores.ExamStore.titleExpain ? (
          <div className='title-expin'>{stores.ExamStore.titleExpain}</div>
        ) : null}
      </div>
      <div
        ref={containerRef}
        className={`exam-content ${type === 'read' || type === 'writte' ? 'exam-content-read-scroll' : ''}`}
        style={{fontSize: `${fontSize}px`, position: 'relative'}}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          {
            type === 'listen' ? (
              <ListenQuestions></ListenQuestions>
            ) : type === 'read' ? (
              <ReadQuestions></ReadQuestions>
            ) : type === 'writte' ?(
              <WritteQuestions></WritteQuestions>
            ) : (
              <></>
            )
          }
        </div>
      </div>
      {
      menuVisible
      ? <div style={{ position: 'absolute', top: menuPosition.y, left: menuPosition.x, zIndex: 999 }} className='menuBox'>
            <p>选中的文本: {selectedText}</p>
            <button onClick={handleHighlight}>Highlight</button>
            <button onClick={handleNote}>NOTE</button>
            <button onClick={handleClear} disabled={!currentHighlightId}>Clear</button>
            <button onClick={handleClearAll} disabled={highlights.length === 0}>Clear All</button>
        </div>
      :<></>
      }
      {
        noteVisible
        ? <div className='note' style={{ position: 'absolute', top: menuPosition.y, left: menuPosition.x, zIndex: 999}}>
          <button onClick={handleNoteClose} className='noteCancel'>x</button>
            <p>选中的文本: {selectedText}</p>
            <TextArea autoFocus onChange={handleNoteText} onBlur={handleBlur} defaultValue={noteText}></TextArea>
          </div>
        : <></>
      }

      {highlights.filter(h => h.note).length > 0 && (
        <div style={{
          position: 'fixed',
          top: boxPosition.y,
          left: boxPosition.x,
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          maxWidth: '300px',
          maxHeight: '200px',
          overflow: 'auto',
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleDragStart}
        >
          <div style={{fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
            NOTE ({highlights.filter(h => h.note).length})
          </div>
          {highlights.filter(h => h.note).map(h => (
            <div key={h.id} style={{
              fontSize: '12px',
              padding: '6px 28px 6px 4px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => setExpandedNoteId(expandedNoteId === h.id ? null : h.id)}
            >
              <div style={{background: 'yellow', display: 'inline-block', padding: '0 4px'}}>
                {h.text.substring(0, 20)}{h.text.length > 20 ? '...' : ''}
              </div>
              {expandedNoteId === h.id && (
                <div style={{color: '#666', fontSize: '11px', marginTop: '2px', whiteSpace: 'pre-wrap'}}>
                  📝 {h.note}
                </div>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear(h.id);
                }}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  lineHeight: '20px',
                  textAlign: 'center',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#999',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = '#ff4d4f';
                  (e.target as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = '#f0f0f0';
                  (e.target as HTMLElement).style.color = '#999';
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className='empty'></div>
    </div>
  );
});

export default ExamContent;