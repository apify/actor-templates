import { Emitter } from 'bee-agent-framework/emitter/emitter';
import { AnyToolSchemaLike } from 'bee-agent-framework/internals/helpers/schema';
import { JSONToolOutput, Tool, ToolEmitter, ToolInput, ToolInputValidationError } from 'bee-agent-framework/tools/base';
import { z } from 'zod';

interface CalculatorSumToolOutput {
    sum: number;
}
/**
 * @class CalculatorSumTool
 * @extends Tool
 *
 * @description
 * This class represents a tool for calculating the sum of a list of numbers.
 * It extends the base Tool class and provides a specific implementation for
 * summing numbers.
 */
export class CalculatorSumTool extends Tool<JSONToolOutput<CalculatorSumToolOutput>> {
    override name: string = 'calculator-sum';

    override description: string = 'Calculates the sum of the provided list of numbers';

    override inputSchema(): Promise<AnyToolSchemaLike> | AnyToolSchemaLike {
        return z.object({
            numbers: z.array(z.number()),
        });
    }

    public readonly emitter: ToolEmitter<ToolInput<this>, JSONToolOutput<CalculatorSumToolOutput>> = Emitter.root.child({
        namespace: ['tool', 'calculator_sum'],
        creator: this,
    });

    protected async _run(input: ToolInput<this>): Promise<JSONToolOutput<CalculatorSumToolOutput>> {
        const { numbers } = input;
        if (!Array.isArray(numbers) || numbers.some((num) => typeof num !== 'number')) {
            throw new ToolInputValidationError('The input must be an array of numbers');
        }
        const sum = numbers.reduce((acc, num) => acc + num, 0);
        return new JSONToolOutput({ sum });
    }

    static {
        // Makes the class serializable
        this.register();
    }
}
