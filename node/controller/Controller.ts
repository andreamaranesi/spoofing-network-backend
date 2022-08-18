import {Repository} from "./repository/Repository"

class Controller{
    private repository:Repository;

    constructor(user){
        this.repository = new Repository(user);
    }
}