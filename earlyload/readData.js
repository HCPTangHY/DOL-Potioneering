(async () => {
    window.StandardModlocalization = window.StandardModlocalization || {};

    window.SimpleYAML = {
        parse(yamlStr) {
            const lines = yamlStr.split(/\r?\n/);
            const root = {};
            const stack = [{ node: root, indent: -1 }];

            for (let line of lines) {
                if (!line || line.trim().length === 0 || line.trim().startsWith('#')) continue;

                const indentMatch = line.match(/^\s*/);
                const indent = indentMatch ? indentMatch[0].length : 0;
                
                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) continue;

                let key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();

                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                    stack.pop();
                }
                const parent = stack[stack.length - 1].node;

                if (value === '') {
                    const newNode = {};
                    parent[key] = newNode;
                    stack.push({ node: newNode, indent: indent });
                } else {
                    parent[key] = value;
                }
            }
            return root;
        }
    };

    window.registerL = function(yamlString) {
        try {
            const data = window.SimpleYAML.parse(yamlString);
            for (const lang in data) {
                if (!window.StandardModlocalization[lang]) {
                    window.StandardModlocalization[lang] = {};
                }
                Object.assign(window.StandardModlocalization[lang], data[lang]);
            }
        } catch (e) {
            console.error("Error registering localization:", e);
        }
    };

    window.getModLanguage = function() {
        let vLang = "";
        try {
            if (window.State && State.variables && State.variables.lang) {
                vLang = State.variables.lang;
            }
        } catch (e) {}

        let lanKey = vLang || navigator.language || "zh-CN";
        
        if (lanKey.startsWith("zh")) return "zh-CN";
        if (lanKey.startsWith("en")) return "en-US";
        return lanKey;
    };

    if (!window.L) {
        window.L = function(key) {
            const lanKey = window.getModLanguage();
            const dict = window.StandardModlocalization || {};
            
            if (dict[lanKey] && dict[lanKey][key]) {
                return dict[lanKey][key];
            }

            if (lanKey !== "zh-CN" && dict["zh-CN"] && dict["zh-CN"][key]) {
                return dict["zh-CN"][key];
            }
            
            return key;
        };
    }
})();
