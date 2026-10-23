/**
 * One budget for the whole run: LLM tokens plus every Actor run the agent starts.
 * `ACTOR_MAX_TOTAL_CHARGE_USD` caps only this Actor's own charges, and a child run is billed to the
 * user separately, so the runtime has to add the two up itself.
 */
export type ModelPrice = { usdPerMillionInputTokens: number; usdPerMillionOutputTokens: number };

export class Budget {
    private llmUsd = 0;
    private actorsUsd = 0;
    private reservedUsd = 0;
    readonly limitUsd: number;
    private readonly price: ModelPrice;

    constructor(limitUsd: number, price: ModelPrice) {
        this.limitUsd = limitUsd;
        this.price = price;
    }

    addTokens(inputTokens = 0, outputTokens = 0): void {
        this.llmUsd +=
            (inputTokens * this.price.usdPerMillionInputTokens + outputTokens * this.price.usdPerMillionOutputTokens) / 1e6;
    }

    /**
     * Reserves money for a child run; the child gets the result as its `maxTotalChargeUsd`. Takes at
     * most half of what is left, so parallel calls in one step all get a share and the model keeps
     * money for its own tokens, but never less than the child's own minimum (the platform refuses a
     * run capped below `minimalMaxTotalChargeUsd`). Returns 0 when even the minimum does not fit.
     */
    reserve(capUsd: number, minimumUsd = 0): number {
        const remaining = this.remainingUsd();
        if (remaining < minimumUsd) return 0;
        const amount = Math.max(minimumUsd, Math.min(capUsd, remaining / 2));
        this.reservedUsd += amount;
        return amount;
    }

    /** Replaces a reservation with what the child run actually cost. */
    settle(reservedUsd: number, spentUsd: number): void {
        this.reservedUsd -= reservedUsd;
        this.actorsUsd += spentUsd;
    }

    spentUsd(): number {
        return this.llmUsd + this.actorsUsd;
    }

    remainingUsd(): number {
        return Math.max(0, this.limitUsd - this.spentUsd() - this.reservedUsd);
    }

    isExhausted(): boolean {
        return this.spentUsd() >= this.limitUsd;
    }

    summary() {
        const round = (n: number) => Math.round(n * 10000) / 10000;
        return { limitUsd: this.limitUsd, llmUsd: round(this.llmUsd), actorsUsd: round(this.actorsUsd) };
    }
}
