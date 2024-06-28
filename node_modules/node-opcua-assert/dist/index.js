"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderError = exports.assert = void 0;
/***
 * @module node-opcua-assert
 */
const chalk_1 = __importDefault(require("chalk"));
const displayAssert = typeof process === "object" ? (process.env.DISPLAY_ASSERT ? true : false) : false;
function assert(cond, message) {
    if (!cond) {
        const err = new Error(message);
        // istanbul ignore next
        if (displayAssert) {
            // tslint:disable:no-console
            console.log(chalk_1.default.whiteBright.bgRed("-----------------------------------------------------------"));
            console.log(chalk_1.default.whiteBright.bgRed(message));
            console.log(chalk_1.default.whiteBright.bgRed("-----------------------------------------------------------"));
        }
        throw err;
    }
}
exports.assert = assert;
exports.default = assert;
function renderError(err) {
    return err;
}
exports.renderError = renderError;
//# sourceMappingURL=index.js.map