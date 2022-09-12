import { StatusCode } from "./StatusCode";

export interface ErrorFactory{
    create(status: number): StatusCode;
}

export class ConcreteErrorFactory implements ErrorFactory{
    create(status: number): StatusCode{
        throw new Error("Method not implemented.");
    }
    
}