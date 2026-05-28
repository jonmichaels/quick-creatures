import { initQuickCreatures } from "./app/quick-creatures-app.js";
import "../scss/module.scss";

Hooks.once("init", () => {
    initQuickCreatures();
});

Hooks.once("ready", async () => {
    // Ensure Lazy GM journal exists
    const MODULE = "quick-creatures";
    const JOURNAL_NAME = "The Lazy GM\u0027s 5e Monster Builder Resource Document";
    let journalId = game.settings.get(MODULE, "lazyGmJournalId");
    let journal = journalId ? game.journal.get(journalId) : null;

    if (!journal) {
        const content = await fetch("modules/quick-creatures/templates/lazy-gm-journal.html")
            .then(r => r.text())
            .catch(() => null);
        if (content) {
            journal = await JournalEntry.create({
                name: JOURNAL_NAME,
                pages: [{
                    name: "Monster Builder Resource Document",
                    type: "text",
                    text: { content }
                }]
            });
            await game.settings.set(MODULE, "lazyGmJournalId", journal.id);
        }
    }
});
