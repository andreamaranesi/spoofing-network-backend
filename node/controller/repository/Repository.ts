
import {User} from "../../models/User";
import { PythonDao } from "./dao/PythonDao";

export class Repository{
    private user:User;
    public pythonDao: PythonDao;

    constructor(user){
        this.user = user;
    }
}