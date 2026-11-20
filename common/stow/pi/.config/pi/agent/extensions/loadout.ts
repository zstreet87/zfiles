/**
 * loadout — keep optional tool groups callable from codemode but out of the
 * model's declared tool list, with a tool set that never changes mid-session.
 *
 * Why not load groups on demand: on providers without mid-conversation tool
 * support (our Anthropic proxy rejects `tool_addition`), any change to the
 * declared tools makes the next request miss the prompt cache, re-sending the
 * whole conversation. So every optional tool is activated once at session
 * start, then hidden through `prepareLoadout`: hidden tools stay callable from
 * `codemode` scripts (`searchTools()`, `tools.<name>()`) and cost no tokens
 * until a script calls them. Subagent tools are model-only (not callable from
 * scripts), so pi-subagents keeps declaring them itself.
 *
 * Only while `codemode` is declared: without it hidden tools would be
 * unreachable, so sessions without it (e.g. subagent children given an
 * explicit tool list) are left exactly as configured.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

/** Tool-name prefixes reachable only through codemode. Anything else is left as its extension set it. */
const HIDDEN = [
	// web: pi-web-access
	"web_search", "fetch_content", "get_search_content", "source_check",
	// research (vaults only): feynman
	"alpha_", "feynman_", "hf_",
	// obsidian: pi-obsidian
	"obsidian_",
	// lens: pi-lens code navigation and diagnostics
	"lens_diagnostics", "symbol_search", "effective_config", "project_report",
	"module_report", "read_symbol", "read_enclosing", "pi_lens_activate_tools",
];
const CARRIER = "zf_loadout";

const isHidden = (name: string) => HIDDEN.some((p) => name.startsWith(p));

export default function (pi: ExtensionAPI) {
	// Carrier for prepareLoadout; it hides its own declaration too, so the model never sees it.
	pi.registerTool({
		name: CARRIER,
		label: "loadout",
		exposure: "model-only",
		description: "Internal: hides optional tools from the declared list.",
		parameters: Type.Object({}),
		async execute() {
			return { content: [{ type: "text", text: "" }], details: {} };
		},
		prepareLoadout: (loadout) => {
			const names = loadout.declared.map((t) => t.name);
			if (!names.includes("codemode")) return { hiddenDeclarations: [CARRIER] };
			return { hiddenDeclarations: names.filter((n) => n === CARRIER || isHidden(n)) };
		},
	});

	// Before the first request: activate every optional tool (direct tools are callable only while active).
	pi.on("session_start", async () => {
		const active = new Set(pi.getActiveTools());
		if (!active.has("codemode")) return;
		for (const t of pi.getAllTools()) if (isHidden(t.name)) active.add(t.name);
		active.add(CARRIER);
		pi.setActiveTools([...active]);
	});
}
