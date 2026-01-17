/* Potioneering Mod - Macros */

// 注册 Llink 宏
// - 如果 key 不存在，会渲染原始文本（便于在 twee 里直接写中文/英文）
// - linkText 使用 wiki 渲染，因此支持在文本里写 <<him>> 等宏
// - 自动路由：如果存在 "Passage|<lang>" 则跳转到对应语言版本
// - 多 Mod 共存：如果已存在同名宏，则跳过注册（避免 cannot clobber existing macro）
(() => {
	const hasMacro = (name) => {
		try {
			if (typeof Macro !== 'undefined') {
				if (typeof Macro.has === 'function') return Macro.has(name);
				if (typeof Macro.get === 'function') return !!Macro.get(name);
			}
		} catch (e) {}
		return false;
	};

	if (typeof Macro === 'undefined' || typeof Macro.add !== 'function') return;
	if (hasMacro('Llink')) return;

	try {
		Macro.add('Llink', {
			isAsync: true,
			tags: null,
			handler() {
				if (this.args.length === 0) return this.error("no localization key specified");
				const lKey = this.args[0];
				let passage = this.args.length > 1 ? this.args[1] : undefined;
				const linkText = window.L ? window.L(lKey) : lKey;

				if (passage != null) {
					const lanKey = window.getModLanguage ? window.getModLanguage() : (navigator.language || "zh-CN");
					const suffix = lanKey.toLowerCase();

					// 路由逻辑：判断存在目标语言后缀的 Passage，则跳转到该 Passage
					const routedPassage = `${passage}|${suffix}`;
					if (Story.has(routedPassage)) passage = routedPassage;
				}

				const $link = jQuery(document.createElement("a"));
				if (passage != null) {
					$link.attr("data-passage", passage);
					if (Story.has(passage)) {
						$link.addClass("link-internal");
						T.link = true;
						if (Config.addVisitedLinkClass && State.hasPlayed(passage)) $link.addClass("link-visited");
					} else $link.addClass("link-broken");
				} else $link.addClass("link-internal");

				$link.wikiWithOptions({ profile: "core" }, linkText)
					.addClass("macro-Llink")
					.ariaClick({ namespace: ".macros", one: passage != null }, this.createShadowWrapper(
						this.payload[0].contents !== "" ? () => {
							if (!(passage && V.nextPassage)) {
								Wikifier.wikifyEval(this.payload[0].contents.trim());
							}
						} : null,
						passage != null ? () => {
							if (V.nextPassage) {
								V.nextPassageIntended = passage;
								passage = V.nextPassage;
								delete V.nextPassage;
							}
							const target = document.querySelector("#storyCaptionDiv");
							window.scrollUIBar = target ? target.scrollTop : null;
							window.scrollMain = document.scrollingElement.scrollTop;

							Engine.play(passage);
						} : null
					))
					.appendTo(this.output);
			}
		});
	} catch (e) {
		console.warn('[Potioneering] Failed to register macro Llink (maybe already exists).', e);
	}
})();

// Chemistry lab icon
Macro.add('chemlabicon', {
    handler() {
        $(this.output).append('<img class="icon" src="img/ui/science.png">');
    }
});
