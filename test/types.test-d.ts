import {
  assistant,
  chatPrompt,
  fromJSON,
  registry,
  toOpenAI,
  messages,
  textPrompt,
  system,
  user,
  type ChatVars,
  type Message,
  type Placeholders,
  type TemplateVars,
  type Value,
} from "../src/index.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>() => {};

assert<Equal<Placeholders<"Hi {{name}}, {{ age }}">, "name" | "age">>();
assert<Equal<Placeholders<"{{a}} {{a}}">, "a">>();
assert<Equal<Placeholders<"no placeholders">, never>>();
assert<Equal<Placeholders<"escaped \\{{x}} but {{y}}">, "y">>();
assert<Equal<Placeholders<"unclosed {{x">, never>>();
assert<Equal<Placeholders<"multi\n{{\n  x\n}}">, "x">>();
assert<Equal<TemplateVars<"{{a}}{{b}}">, { a: Value; b: Value }>>();
assert<Equal<TemplateVars<string>, Record<string, Value>>>();

const greet = textPrompt("Hello {{name}}, you are a {{role}}.");
greet.format({ name: "Ada", role: "admin" });
greet.format({ name: "Ada", role: 1 }, { onMissing: "throw" });
// @ts-expect-error missing "role"
greet.format({ name: "Ada" });
// @ts-expect-error unknown key "foo"
greet.format({ name: "Ada", role: "admin", foo: 1 });
// @ts-expect-error vars are required
greet.format();
// @ts-expect-error objects are not values
greet.format({ name: {}, role: "admin" });

const fixed = textPrompt("static");
fixed.format();
// @ts-expect-error no variables to pass
fixed.format({ extra: 1 });

const dynamic: string = "loaded at runtime";
textPrompt(dynamic).format({ anything: "goes" });
textPrompt(dynamic).format();

const long = textPrompt("line 0: {{v0}} line 1: {{v1}} line 2: {{v2}} line 3: {{v3}} line 4: {{v4}} line 5: {{v5}} line 6: {{v6}} line 7: {{v7}} line 8: {{v8}} line 9: {{v9}} line 10: {{v10}} line 11: {{v11}} line 12: {{v12}} line 13: {{v13}} line 14: {{v14}} line 15: {{v15}} line 16: {{v16}} line 17: {{v17}} line 18: {{v18}} line 19: {{v19}} line 20: {{v20}} line 21: {{v21}} line 22: {{v22}} line 23: {{v23}} line 24: {{v24}} line 25: {{v25}} line 26: {{v26}} line 27: {{v27}} line 28: {{v28}} line 29: {{v29}} line 30: {{v30}} line 31: {{v31}} line 32: {{v32}} line 33: {{v33}} line 34: {{v34}} line 35: {{v35}} line 36: {{v36}} line 37: {{v37}} line 38: {{v38}} line 39: {{v39}} line 40: {{v40}} line 41: {{v41}} line 42: {{v42}} line 43: {{v43}} line 44: {{v44}} line 45: {{v45}} line 46: {{v46}} line 47: {{v47}} line 48: {{v48}} line 49: {{v49}} line 50: {{v50}} line 51: {{v51}} line 52: {{v52}} line 53: {{v53}} line 54: {{v54}} line 55: {{v55}} line 56: {{v56}} line 57: {{v57}} line 58: {{v58}} line 59: {{v59}} line 60: {{v60}} line 61: {{v61}} line 62: {{v62}} line 63: {{v63}} line 64: {{v64}} line 65: {{v65}} line 66: {{v66}} line 67: {{v67}} line 68: {{v68}} line 69: {{v69}} line 70: {{v70}} line 71: {{v71}} line 72: {{v72}} line 73: {{v73}} line 74: {{v74}} line 75: {{v75}} line 76: {{v76}} line 77: {{v77}} line 78: {{v78}} line 79: {{v79}} line 80: {{v80}} line 81: {{v81}} line 82: {{v82}} line 83: {{v83}} line 84: {{v84}} line 85: {{v85}} line 86: {{v86}} line 87: {{v87}} line 88: {{v88}} line 89: {{v89}} line 90: {{v90}} line 91: {{v91}} line 92: {{v92}} line 93: {{v93}} line 94: {{v94}} line 95: {{v95}} line 96: {{v96}} line 97: {{v97}} line 98: {{v98}} line 99: {{v99}} line 100: {{v100}} line 101: {{v101}} line 102: {{v102}} line 103: {{v103}} line 104: {{v104}} line 105: {{v105}} line 106: {{v106}} line 107: {{v107}} line 108: {{v108}} line 109: {{v109}} line 110: {{v110}} line 111: {{v111}} line 112: {{v112}} line 113: {{v113}} line 114: {{v114}} line 115: {{v115}} line 116: {{v116}} line 117: {{v117}} line 118: {{v118}} line 119: {{v119}} line 120: {{v120}} line 121: {{v121}} line 122: {{v122}} line 123: {{v123}} line 124: {{v124}} line 125: {{v125}} line 126: {{v126}} line 127: {{v127}} line 128: {{v128}} line 129: {{v129}} line 130: {{v130}} line 131: {{v131}} line 132: {{v132}} line 133: {{v133}} line 134: {{v134}} line 135: {{v135}} line 136: {{v136}} line 137: {{v137}} line 138: {{v138}} line 139: {{v139}} line 140: {{v140}} line 141: {{v141}} line 142: {{v142}} line 143: {{v143}} line 144: {{v144}} line 145: {{v145}} line 146: {{v146}} line 147: {{v147}} line 148: {{v148}} line 149: {{v149}} line 150: {{v150}} line 151: {{v151}} line 152: {{v152}} line 153: {{v153}} line 154: {{v154}} line 155: {{v155}} line 156: {{v156}} line 157: {{v157}} line 158: {{v158}} line 159: {{v159}} line 160: {{v160}} line 161: {{v161}} line 162: {{v162}} line 163: {{v163}} line 164: {{v164}} line 165: {{v165}} line 166: {{v166}} line 167: {{v167}} line 168: {{v168}} line 169: {{v169}} line 170: {{v170}} line 171: {{v171}} line 172: {{v172}} line 173: {{v173}} line 174: {{v174}} line 175: {{v175}} line 176: {{v176}} line 177: {{v177}} line 178: {{v178}} line 179: {{v179}} line 180: {{v180}} line 181: {{v181}} line 182: {{v182}} line 183: {{v183}} line 184: {{v184}} line 185: {{v185}} line 186: {{v186}} line 187: {{v187}} line 188: {{v188}} line 189: {{v189}} line 190: {{v190}} line 191: {{v191}} line 192: {{v192}} line 193: {{v193}} line 194: {{v194}} line 195: {{v195}} line 196: {{v196}} line 197: {{v197}} line 198: {{v198}} line 199: {{v199}} line 200: {{v200}} line 201: {{v201}} line 202: {{v202}} line 203: {{v203}} line 204: {{v204}} line 205: {{v205}} line 206: {{v206}} line 207: {{v207}} line 208: {{v208}} line 209: {{v209}} line 210: {{v210}} line 211: {{v211}} line 212: {{v212}} line 213: {{v213}} line 214: {{v214}} line 215: {{v215}} line 216: {{v216}} line 217: {{v217}} line 218: {{v218}} line 219: {{v219}} line 220: {{v220}} line 221: {{v221}} line 222: {{v222}} line 223: {{v223}} line 224: {{v224}} line 225: {{v225}} line 226: {{v226}} line 227: {{v227}} line 228: {{v228}} line 229: {{v229}} line 230: {{v230}} line 231: {{v231}} line 232: {{v232}} line 233: {{v233}} line 234: {{v234}} line 235: {{v235}} line 236: {{v236}} line 237: {{v237}} line 238: {{v238}} line 239: {{v239}} line 240: {{v240}} line 241: {{v241}} line 242: {{v242}} line 243: {{v243}} line 244: {{v244}} line 245: {{v245}} line 246: {{v246}} line 247: {{v247}} line 248: {{v248}} line 249: {{v249}} line 250: {{v250}} line 251: {{v251}} line 252: {{v252}} line 253: {{v253}} line 254: {{v254}} line 255: {{v255}} line 256: {{v256}} line 257: {{v257}} line 258: {{v258}} line 259: {{v259}} line 260: {{v260}} line 261: {{v261}} line 262: {{v262}} line 263: {{v263}} line 264: {{v264}} line 265: {{v265}} line 266: {{v266}} line 267: {{v267}} line 268: {{v268}} line 269: {{v269}} line 270: {{v270}} line 271: {{v271}} line 272: {{v272}} line 273: {{v273}} line 274: {{v274}} line 275: {{v275}} line 276: {{v276}} line 277: {{v277}} line 278: {{v278}} line 279: {{v279}} line 280: {{v280}} line 281: {{v281}} line 282: {{v282}} line 283: {{v283}} line 284: {{v284}} line 285: {{v285}} line 286: {{v286}} line 287: {{v287}} line 288: {{v288}} line 289: {{v289}} line 290: {{v290}} line 291: {{v291}} line 292: {{v292}} line 293: {{v293}} line 294: {{v294}} line 295: {{v295}} line 296: {{v296}} line 297: {{v297}} line 298: {{v298}} line 299: {{v299}}");
long.format({} as Exclude<Parameters<typeof long.format>[0], undefined>);
// @ts-expect-error a 300-placeholder template still reports missing keys
long.format({ v0: 1 });

const chat = chatPrompt([
  system("You are a {{persona}}."),
  messages("history"),
  user("As {{persona}}, answer: {{question}}"),
  assistant("Answer:"),
]);
assert<Equal<Parameters<typeof chat.format>[0], { persona: Value; question: Value; history: readonly Message[] }>>();
const turns: Message[] = chat.format({ persona: "pirate", question: "why?", history: [] });
const flat: string = chat.formatText({ persona: "pirate", question: "why?", history: [] });
// @ts-expect-error missing "history"
chat.format({ persona: "pirate", question: "why?" });
// @ts-expect-error history must be messages
chat.format({ persona: "pirate", question: "why?", history: "no" });
// @ts-expect-error bad role in history
chat.format({ persona: "pirate", question: "why?", history: [{ role: "robot", content: "" }] });

chatPrompt([user("hi")]).format();

// @ts-expect-error "history" is used as both a text variable and a messages slot
chatPrompt([system("Context: {{history}}"), messages("history")]);

const wide: string = "runtime";
chatPrompt([user(wide)]).format({ anything: 1 });
assert<Equal<ChatVars<ReturnType<typeof user<string>>>, Record<string, Value | readonly Message[]>>>();

const prompts = registry({ greet, chat, fixed });
assert<Equal<ReturnType<typeof prompts.names>, ("greet" | "chat" | "fixed")[]>>();
assert<Equal<ReturnType<typeof prompts.get<"greet">>, typeof greet>>();
prompts.get("greet").format({ name: "Ada", role: "admin" });
// @ts-expect-error autocomplete only offers registered names
prompts.get("nope");
// @ts-expect-error the fetched prompt keeps its variable types
prompts.get("greet").format({ name: "Ada" });
const runtimeName: string = "greet";
if (prompts.has(runtimeName)) prompts.get(runtimeName);

const loaded = fromJSON<typeof greet>(JSON.stringify(greet));
loaded.format({ name: "Ada", role: "admin" });
// @ts-expect-error the type argument restores variable checking
loaded.format({ name: "Ada" });
const untyped = fromJSON("{}");
if (untyped.kind === "chat") untyped.format({ anything: "goes" });

toOpenAI(chat.format({ persona: "p", question: "q", history: [] }), { systemRole: "developer" });
// @ts-expect-error unknown system role
toOpenAI([], { systemRole: "admin" });

const greetUser = user("Hi {{name}}");
assert<Equal<ReturnType<typeof greetUser.format>, { role: "user"; content: string }>>();
const formatted: Message = greetUser.format({ name: "Ada" });
// @ts-expect-error message template keeps its variable types
greetUser.format();
// @ts-expect-error no placeholders means no variables
system("static").format({ extra: 1 });
chat.format({ persona: "p", question: "q", history: [system("s").format(), assistant("a").format()] });
// @ts-expect-error history takes messages, not templates
chat.format({ persona: "p", question: "q", history: [system("s")] });
