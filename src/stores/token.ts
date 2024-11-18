import { makeAutoObservable} from "mobx";

class UserStore {

    name = "";

    constructor() {
        makeAutoObservable(this);
        this.name =  localStorage.getItem('student') || '';
    }

    login(name: string): void {
        this.name = name;
        localStorage.setItem('student', name);
    }

    logout() {
        localStorage.setItem('student', '');
        this.name = '';
        console.log("logout finished!");
    }

}
export default new UserStore();