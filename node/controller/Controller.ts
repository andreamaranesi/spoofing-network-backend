import {Repository} from "./repository/Repository"

class Controller{
    private repository:Repository;

    constructor(user_email){
        this.repository = new Repository(user_email);
    }


}