import React from 'react';
import { Space, Table, Typography } from 'antd';
import type { TableProps } from 'antd';

interface RecordType {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  address1: string;
  address2: string;
  address3: string;
}

const fixedColumns: TableProps<RecordType>['columns'] = [
  {
    title: '试卷名称',
    dataIndex: 'id',
    width: 200,
    fixed: 'left',
  },
  {
    title: '试卷总分',
    dataIndex: 'firstName',
    width: 120,
    fixed: 'left',
  },
  {
    title: '最终得分',
    dataIndex: 'lastName',
    width: 120,
    fixed: 'left',
  },
  {
    title: '总耗时',
    dataIndex: 'age',
    width: 120,
    onCell: (record) => ({
      colSpan: record.id % 4 === 0 ? 2 : 1,
    }),
  },
  {
    title: '提交时间',
    dataIndex: 'address1',
    onCell: (record) => ({
      colSpan: record.id % 4 === 0 ? 0 : 1,
    }),
  },
  {
    title: '操作',
    width: 150,
    fixed: 'right',
    render: () => (
      <Space>
        <Typography.Link>查看试卷</Typography.Link>
      </Space>
    ),
  },
];

const getData = (length: number) =>
  Array.from({ length }).map<RecordType>((_, index) => ({
    id: index,
    firstName: `${index.toString(16)}`,
    lastName: `${index.toString(16)}`,
    age: 25 + (index % 10),
    address1: `New York No. ${index} Lake Park`,
    address2: `London No. ${index} Lake Park`,
    address3: `Sydney No. ${index} Lake Park`,
  }));

export default function Record() {
  const [fixed, setFixed] = React.useState(true);
  const [bordered, setBordered] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);
  const [empty, setEmpty] = React.useState(false);
  const [count, setCount] = React.useState(10000);

  const tblRef: Parameters<typeof Table>[0]['ref'] = React.useRef(null);

  const data = React.useMemo<RecordType[]>(() => getData(count), [count]);

  const mergedColumns = React.useMemo<typeof fixedColumns>(() => {

    if (!expanded) {
      return fixedColumns;
    }

    return fixedColumns?.map((col) => ({ ...col, onCell: undefined }));
  }, [expanded, fixed]);

  const expandableProps = React.useMemo<TableProps<RecordType>['expandable']>(() => {
    if (!expanded) {
      return undefined;
    }

    return {
      columnWidth: 48,
      expandedRowRender: (record) => <p style={{ margin: 0 }}>🎉 Expanded {record.address1}</p>,
      rowExpandable: (record) => record.id % 2 === 0,
    };
  }, [expanded]);

  return (
    <div style={{ padding: 64 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Table<RecordType>
          bordered={bordered}
          virtual
          columns={mergedColumns}
          scroll={{ x: 2000, y: 400 }}
          rowKey="id"
          dataSource={empty ? [] : data}
          pagination={false}
          ref={tblRef}
          rowSelection={expanded ? undefined : { type: 'radio', columnWidth: 48 }}
          expandable={expandableProps}
        />
      </Space>
    </div>
  );
}