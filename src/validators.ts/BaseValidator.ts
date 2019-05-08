import { TSBufferSchema } from "tsbuffer-schema";
import { ValidateResult } from "../ValidateResult";

export abstract class BaseValidator {

    abstract validate(value: any, schema: TSBufferSchema): ValidateResult;

}