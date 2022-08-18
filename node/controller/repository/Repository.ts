
import {UserDao} from "./dao/UserDao"
import { UserDaoImpl } from "./dao/UserDaoImpl";
import {User} from "../../models/User";

export class Repository{
    private user:User;
    public userDao: UserDao;

    constructor(user_email:string){
        this.userDao = new UserDaoImpl()
    }
}