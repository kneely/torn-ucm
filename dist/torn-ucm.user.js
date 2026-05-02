// ==UserScript==
// @name         Torn UCM - Ultimate Chain Manager
// @namespace    https://github.com/kneely/torn-ucm-userscript
// @version      0.0.7
// @description  Faction chain coordination for Torn - real-time commands, attack blocking, and presence tracking
// @author       kneely
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      ucm.neelyinno.com
// @connect      us.i.posthog.com
// @connect      us-assets.i.posthog.com
// @run-at       document-idle
// ==/UserScript==
(function() {
	//#region node_modules/posthog-js/dist/module.js
	var t = "undefined" != typeof window ? window : void 0, e = "undefined" != typeof globalThis ? globalThis : t;
	"undefined" == typeof self && (e.self = e), "undefined" == typeof File && (e.File = function() {});
	var i = null == e ? void 0 : e.navigator, r = null == e ? void 0 : e.document, s = null == e ? void 0 : e.location, n = null == e ? void 0 : e.fetch, o = null != e && e.XMLHttpRequest && "withCredentials" in new e.XMLHttpRequest() ? e.XMLHttpRequest : void 0, a = null == e ? void 0 : e.AbortController, l = null == e ? void 0 : e.CompressionStream, u = null == i ? void 0 : i.userAgent, h = null != t ? t : {}, d = "1.372.6", v = {
		DEBUG: !1,
		LIB_VERSION: d,
		LIB_NAME: "web",
		JS_SDK_VERSION: d
	};
	function c(t, e, i, r, s, n, o) {
		try {
			var a = t[n](o), l = a.value;
		} catch (t) {
			i(t);
			return;
		}
		a.done ? e(l) : Promise.resolve(l).then(r, s);
	}
	function p(t) {
		return function() {
			var e = this, i = arguments;
			return new Promise((function(r, s) {
				var n = t.apply(e, i);
				function o(t) {
					c(n, r, s, o, a, "next", t);
				}
				function a(t) {
					c(n, r, s, o, a, "throw", t);
				}
				o(void 0);
			}));
		};
	}
	function f() {
		return f = Object.assign ? Object.assign.bind() : function(t) {
			for (var e = 1; arguments.length > e; e++) {
				var i = arguments[e];
				for (var r in i) ({}).hasOwnProperty.call(i, r) && (t[r] = i[r]);
			}
			return t;
		}, f.apply(null, arguments);
	}
	function _(t, e) {
		if (null == t) return {};
		var i = {};
		for (var r in t) if ({}.hasOwnProperty.call(t, r)) {
			if (-1 !== e.indexOf(r)) continue;
			i[r] = t[r];
		}
		return i;
	}
	function g() {
		return g = p((function* (t, e, i) {
			void 0 === e && (e = !0);
			try {
				var r = new CompressionStream("gzip"), s = r.writable.getWriter(), n = s.write(new TextEncoder().encode(t)).then((() => s.close())).catch(function() {
					var t = p((function* (t) {
						try {
							yield s.abort(t);
						} catch (t) {}
						throw t;
					}));
					return function(e) {
						return t.apply(this, arguments);
					};
				}()), o = new Response(r.readable).blob(), [a] = yield Promise.all([o, n]);
				return a;
			} catch (t) {
				if (null != i && i.rethrow) throw t;
				return e && console.error("Failed to gzip compress data", t), null;
			}
		})), g.apply(this, arguments);
	}
	var m = [
		"amazonbot",
		"amazonproductbot",
		"app.hypefactors.com",
		"applebot",
		"archive.org_bot",
		"awariobot",
		"backlinksextendedbot",
		"baiduspider",
		"bingbot",
		"bingpreview",
		"chrome-lighthouse",
		"dataforseobot",
		"deepscan",
		"duckduckbot",
		"facebookexternal",
		"facebookcatalog",
		"http://yandex.com/bots",
		"hubspot",
		"ia_archiver",
		"leikibot",
		"linkedinbot",
		"meta-externalagent",
		"mj12bot",
		"msnbot",
		"nessus",
		"petalbot",
		"pinterest",
		"prerender",
		"rogerbot",
		"screaming frog",
		"sebot-wa",
		"sitebulb",
		"slackbot",
		"slurp",
		"trendictionbot",
		"turnitin",
		"twitterbot",
		"vercel-screenshot",
		"vercelbot",
		"yahoo! slurp",
		"yandexbot",
		"zoombot",
		"bot.htm",
		"bot.php",
		"(bot;",
		"bot/",
		"crawler",
		"ahrefsbot",
		"ahrefssiteaudit",
		"semrushbot",
		"siteauditbot",
		"splitsignalbot",
		"gptbot",
		"oai-searchbot",
		"chatgpt-user",
		"perplexitybot",
		"better uptime bot",
		"sentryuptimebot",
		"uptimerobot",
		"headlesschrome",
		"cypress",
		"google-hoteladsverifier",
		"adsbot-google",
		"apis-google",
		"duplexweb-google",
		"feedfetcher-google",
		"google favicon",
		"google web preview",
		"google-read-aloud",
		"googlebot",
		"googleother",
		"google-cloudvertexbot",
		"googleweblight",
		"mediapartners-google",
		"storebot-google",
		"google-inspectiontool",
		"bytespider"
	], b = function(t, e) {
		if (void 0 === e && (e = []), !t) return !1;
		var i = t.toLowerCase();
		return m.concat(e).some(((t) => {
			var e = t.toLowerCase();
			return -1 !== i.indexOf(e);
		}));
	}, y = [
		"$snapshot",
		"$pageview",
		"$pageleave",
		"$set",
		"survey dismissed",
		"survey sent",
		"survey shown",
		"$identify",
		"$groupidentify",
		"$create_alias",
		"$$client_ingestion_warning",
		"$web_experiment_applied",
		"$feature_enrollment_update",
		"$feature_flag_called"
	];
	function w(t, e) {
		return -1 !== t.indexOf(e);
	}
	var x = function(t) {
		return t.trim();
	}, E = function(t) {
		return t.replace(/^\$/, "");
	}, S = Object.prototype, T = S.hasOwnProperty, k = S.toString, R = Array.isArray || function(t) {
		return "[object Array]" === k.call(t);
	}, P = (t) => "function" == typeof t, O = (t) => t === Object(t) && !R(t), I = (t) => {
		if (O(t)) {
			for (var e in t) if (T.call(t, e)) return !1;
			return !0;
		}
		return !1;
	}, C = (t) => void 0 === t, A = (t) => "[object String]" == k.call(t), F = (t) => A(t) && 0 === t.trim().length, M = (t) => null === t, D = (t) => C(t) || M(t), L = (t) => "[object Number]" == k.call(t) && t == t, U = (t) => L(t) && t > 0, N = (t) => "[object Boolean]" === k.call(t), j = (t) => t instanceof FormData, z = (t) => w(y, t);
	function B(t) {
		return null === t || "object" != typeof t;
	}
	function H(t, e) {
		return {}.toString.call(t) === "[object " + e + "]";
	}
	function q(t) {
		return "undefined" != typeof Event && function(t, e) {
			try {
				return t instanceof e;
			} catch (t) {
				return !1;
			}
		}(t, Event);
	}
	var V = [
		!0,
		"true",
		1,
		"1",
		"yes"
	], W = (t) => w(V, t), G = [
		!1,
		"false",
		0,
		"0",
		"no"
	];
	function Y(t, e, i, r, s) {
		return e > i && (r.warn("min cannot be greater than max."), e = i), L(t) ? t > i ? (r.warn(" cannot be  greater than max: " + i + ". Using max value instead."), i) : e > t ? (r.warn(" cannot be less than min: " + e + ". Using min value instead."), e) : t : (r.warn(" must be a number. using max or fallback. max: " + i + ", fallback: " + s), Y(s || i, e, i, r));
	}
	var J = class {
		constructor(t) {
			this.$t = {}, this.zt = t.zt, this.Ut = Y(t.bucketSize, 0, 100, t.Gt), this.Wt = Y(t.refillRate, 0, this.Ut, t.Gt), this.Xt = Y(t.refillInterval, 0, 864e5, t.Gt);
		}
		Jt(t, e) {
			var i = Math.floor((e - t.lastAccess) / this.Xt);
			i > 0 && (t.tokens = Math.min(t.tokens + i * this.Wt, this.Ut), t.lastAccess = t.lastAccess + i * this.Xt);
		}
		consumeRateLimit(t) {
			var e, i = Date.now(), r = String(t), s = this.$t[r];
			return s ? this.Jt(s, i) : this.$t[r] = s = {
				tokens: this.Ut,
				lastAccess: i
			}, 0 === s.tokens || (s.tokens--, 0 === s.tokens && (null == (e = this.zt) || e.call(this, t)), 0 === s.tokens);
		}
		stop() {
			this.$t = {};
		}
	};
	var K, X, Q, Z = (t, e, i) => {
		function r(r) {
			for (var s = arguments.length, n = new Array(s > 1 ? s - 1 : 0), o = 1; s > o; o++) n[o - 1] = arguments[o];
			e((() => {
				(0, i[r])(t, ...n);
			}));
		}
		return {
			debug() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				r("debug", ...e);
			},
			info() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				r("log", ...e);
			},
			warn() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				r("warn", ...e);
			},
			error() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				r("error", ...e);
			},
			critical() {
				for (var e = arguments.length, r = new Array(e), s = 0; e > s; s++) r[s] = arguments[s];
				i.error(t, ...r);
			},
			createLogger: (r) => Z(t + " " + r, e, i)
		};
	}, tt = "Mobile", et = "iOS", it = "Android", rt = "Tablet", st = it + " " + rt, nt = "iPad", ot = "Apple", at = ot + " Watch", lt = "Safari", ut = "BlackBerry", ht = "Samsung", dt = ht + "Browser", vt = ht + " Internet", ct = "Chrome", pt = ct + " OS", ft = ct + " " + et, _t = "Internet Explorer", gt = _t + " " + tt, mt = "Opera", bt = mt + " Mini", yt = "Edge", wt = "Microsoft " + yt, xt = "Firefox", Et = xt + " " + et, St = "Nintendo", $t = "PlayStation", Tt = "Xbox", kt = it + " " + tt, Rt = tt + " " + lt, Pt = "Windows", Ot = Pt + " Phone", It = "Nokia", Ct = "Ouya", At = "Generic", Ft = At + " " + tt.toLowerCase(), Mt = At + " " + rt.toLowerCase(), Dt = "Konqueror", Lt = "(\\d+(\\.\\d+)?)", Ut = new RegExp("Version/" + Lt), Nt = new RegExp(Tt, "i"), jt = new RegExp($t + " \\w+", "i"), zt = new RegExp(St + " \\w+", "i"), Bt = new RegExp(ut + "|PlayBook|BB10", "i"), Ht = {
		"NT3.51": "NT 3.11",
		"NT4.0": "NT 4.0",
		"5.0": "2000",
		5.1: "XP",
		5.2: "XP",
		"6.0": "Vista",
		6.1: "7",
		6.2: "8",
		6.3: "8.1",
		6.4: "10",
		"10.0": "10"
	}, qt = function(t, e) {
		return e = e || "", w(t, " OPR/") && w(t, "Mini") ? bt : w(t, " OPR/") ? mt : Bt.test(t) ? ut : w(t, "IE" + tt) || w(t, "WPDesktop") ? gt : w(t, dt) ? vt : w(t, yt) || w(t, "Edg/") ? wt : w(t, "FBIOS") ? "Facebook " + tt : w(t, "UCWEB") || w(t, "UCBrowser") ? "UC Browser" : w(t, "CriOS") ? ft : w(t, "CrMo") || w(t, ct) ? ct : w(t, it) && w(t, lt) ? kt : w(t, "FxiOS") ? Et : w(t.toLowerCase(), Dt.toLowerCase()) ? Dt : ((t, e) => e && w(e, ot) || function(t) {
			return w(t, lt) && !w(t, ct) && !w(t, it);
		}(t))(t, e) ? w(t, tt) ? Rt : lt : w(t, xt) ? xt : w(t, "MSIE") || w(t, "Trident/") ? _t : w(t, "Gecko") ? xt : "";
	}, Vt = {
		[gt]: [new RegExp("rv:" + Lt)],
		[wt]: [new RegExp(yt + "?\\/" + Lt)],
		[ct]: [new RegExp("(" + ct + "|CrMo)\\/" + Lt)],
		[ft]: [new RegExp("CriOS\\/" + Lt)],
		"UC Browser": [new RegExp("(UCBrowser|UCWEB)\\/" + Lt)],
		[lt]: [Ut],
		[Rt]: [Ut],
		[mt]: [new RegExp("(Opera|OPR)\\/" + Lt)],
		[xt]: [new RegExp(xt + "\\/" + Lt)],
		[Et]: [new RegExp("FxiOS\\/" + Lt)],
		[Dt]: [new RegExp("Konqueror[:/]?" + Lt, "i")],
		[ut]: [new RegExp(ut + " " + Lt), Ut],
		[kt]: [new RegExp("android\\s" + Lt, "i")],
		[vt]: [new RegExp(dt + "\\/" + Lt)],
		[_t]: [new RegExp("(rv:|MSIE )" + Lt)],
		Mozilla: [new RegExp("rv:" + Lt)]
	}, Wt = function(t, e) {
		var r = Vt[qt(t, e)];
		if (C(r)) return null;
		for (var s = 0; r.length > s; s++) {
			var n = t.match(r[s]);
			if (n) return parseFloat(n[n.length - 2]);
		}
		return null;
	}, Gt = [
		[new RegExp(Tt + "; " + Tt + " (.*?)[);]", "i"), (t) => [Tt, t && t[1] || ""]],
		[new RegExp(St, "i"), [St, ""]],
		[new RegExp($t, "i"), [$t, ""]],
		[Bt, [ut, ""]],
		[new RegExp(Pt, "i"), (t, e) => {
			if (/Phone/.test(e) || /WPDesktop/.test(e)) return [Ot, ""];
			if (new RegExp(tt).test(e) && !/IEMobile\b/.test(e)) return [Pt + " " + tt, ""];
			var i = /Windows NT ([0-9.]+)/i.exec(e);
			if (i && i[1]) {
				var r = Ht[i[1]] || "";
				return /arm/i.test(e) && (r = "RT"), [Pt, r];
			}
			return [Pt, ""];
		}],
		[/((iPhone|iPad|iPod).*?OS (\d+)_(\d+)_?(\d+)?|iPhone)/, (t) => t && t[3] ? [et, [
			t[3],
			t[4],
			t[5] || "0"
		].join(".")] : [et, ""]],
		[/(watch.*\/(\d+\.\d+\.\d+)|watch os,(\d+\.\d+),)/i, (t) => {
			var e = "";
			return t && t.length >= 3 && (e = C(t[2]) ? t[3] : t[2]), ["watchOS", e];
		}],
		[new RegExp("(" + it + " (\\d+)\\.(\\d+)\\.?(\\d+)?|" + it + ")", "i"), (t) => t && t[2] ? [it, [
			t[2],
			t[3],
			t[4] || "0"
		].join(".")] : [it, ""]],
		[/Mac OS X (\d+)[_.](\d+)[_.]?(\d+)?/i, (t) => {
			var e = ["Mac OS X", ""];
			return t && t[1] && (e[1] = [
				t[1],
				t[2],
				t[3] || "0"
			].join(".")), e;
		}],
		[/Mac/i, ["Mac OS X", ""]],
		[/CrOS/, [pt, ""]],
		[/Linux|debian/i, ["Linux", ""]]
	], Yt = function(t) {
		return zt.test(t) ? St : jt.test(t) ? $t : Nt.test(t) ? Tt : new RegExp(Ct, "i").test(t) ? Ct : new RegExp("(" + Ot + "|WPDesktop)", "i").test(t) ? Ot : /iPad/.test(t) ? nt : /iPod/.test(t) ? "iPod Touch" : /iPhone/.test(t) ? "iPhone" : /(watch)(?: ?os[,/]|\d,\d\/)[\d.]+/i.test(t) ? at : Bt.test(t) ? ut : /(kobo)\s(ereader|touch)/i.test(t) ? "Kobo" : new RegExp(It, "i").test(t) ? It : /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i.test(t) || /(kf[a-z]+)( bui|\)).+silk\//i.test(t) ? "Kindle Fire" : /(Android|ZTE)/i.test(t) ? new RegExp(tt).test(t) && !/(9138B|TB782B|Nexus [97]|pixel c|HUAWEISHT|BTV|noble nook|smart ultra 6)/i.test(t) || /pixel[\daxl ]{1,6}/i.test(t) && !/pixel c/i.test(t) || /(huaweimed-al00|tah-|APA|SM-G92|i980|zte|U304AA)/i.test(t) || /lmy47v/i.test(t) && !/QTAQZ3/i.test(t) ? it : st : new RegExp("(pda|" + tt + ")", "i").test(t) ? Ft : new RegExp(rt, "i").test(t) && !new RegExp(rt + " pc", "i").test(t) ? Mt : "";
	}, Jt = (t) => t instanceof Error, Kt = {
		trace: {
			text: "TRACE",
			number: 1
		},
		debug: {
			text: "DEBUG",
			number: 5
		},
		info: {
			text: "INFO",
			number: 9
		},
		warn: {
			text: "WARN",
			number: 13
		},
		error: {
			text: "ERROR",
			number: 17
		},
		fatal: {
			text: "FATAL",
			number: 21
		}
	}, Xt = Kt.info;
	function Qt(t) {
		if (N(t)) return { boolValue: t };
		if ("number" == typeof t) return Number.isFinite(t) ? Number.isInteger(t) ? { intValue: t } : { doubleValue: t } : { stringValue: String(t) };
		if ("string" == typeof t) return { stringValue: t };
		if (R(t)) return { arrayValue: { values: t.map(((t) => Qt(t))) } };
		try {
			return { stringValue: JSON.stringify(t) };
		} catch (e) {
			return { stringValue: String(t) };
		}
	}
	function Zt(t) {
		var e = [];
		for (var i in t) {
			var r = t[i];
			M(r) || C(r) || e.push({
				key: i,
				value: Qt(r)
			});
		}
		return e;
	}
	function te(t) {
		var e = globalThis._posthogChunkIds;
		if (e) {
			var i = Object.keys(e);
			return Q && i.length === X || (X = i.length, Q = i.reduce(((i, r) => {
				K || (K = {});
				var s = K[r];
				if (s) i[s[0]] = s[1];
				else for (var n = t(r), o = n.length - 1; o >= 0; o--) {
					var a = n[o], l = null == a ? void 0 : a.filename, u = e[r];
					if (l && u) {
						i[l] = u, K[r] = [l, u];
						break;
					}
				}
				return i;
			}), {})), Q;
		}
	}
	var ee = class {
		constructor(t, e, i) {
			void 0 === i && (i = []), this.coercers = t, this.stackParser = e, this.modifiers = i;
		}
		buildFromUnknown(t, e) {
			void 0 === e && (e = {});
			var i = e && e.mechanism || {
				handled: !0,
				type: "generic"
			}, r = this.buildCoercingContext(i, e, 0).apply(t), s = this.buildParsingContext(e), n = this.parseStacktrace(r, s);
			return {
				$exception_list: this.convertToExceptionList(n, i),
				$exception_level: "error"
			};
		}
		modifyFrames(t) {
			var e = this;
			return p((function* () {
				for (var i of t) i.stacktrace && i.stacktrace.frames && R(i.stacktrace.frames) && (i.stacktrace.frames = yield e.applyModifiers(i.stacktrace.frames));
				return t;
			}))();
		}
		coerceFallback(t) {
			var e;
			return {
				type: "Error",
				value: "Unknown error",
				stack: null == (e = t.syntheticException) ? void 0 : e.stack,
				synthetic: !0
			};
		}
		parseStacktrace(t, e) {
			var i, r;
			return null != t.cause && (i = this.parseStacktrace(t.cause, e)), "" != t.stack && null != t.stack && (r = this.applyChunkIds(this.stackParser(t.stack, t.synthetic ? e.skipFirstLines : 0), e.chunkIdMap)), f({}, t, {
				cause: i,
				stack: r
			});
		}
		applyChunkIds(t, e) {
			return t.map(((t) => (t.filename && e && (t.chunk_id = e[t.filename]), t)));
		}
		applyCoercers(t, e) {
			for (var i of this.coercers) if (i.match(t)) return i.coerce(t, e);
			return this.coerceFallback(e);
		}
		applyModifiers(t) {
			var e = this;
			return p((function* () {
				var i = t;
				for (var r of e.modifiers) i = yield r(i);
				return i;
			}))();
		}
		convertToExceptionList(t, e) {
			var i, r, s, n = {
				type: t.type,
				value: t.value,
				mechanism: {
					type: null !== (i = e.type) && void 0 !== i ? i : "generic",
					handled: null === (r = e.handled) || void 0 === r || r,
					synthetic: null !== (s = t.synthetic) && void 0 !== s && s
				}
			};
			t.stack && (n.stacktrace = {
				type: "raw",
				frames: t.stack
			});
			var o = [n];
			return null != t.cause && o.push(...this.convertToExceptionList(t.cause, f({}, e, { handled: !0 }))), o;
		}
		buildParsingContext(t) {
			var e;
			return {
				chunkIdMap: te(this.stackParser),
				skipFirstLines: null !== (e = t.skipFirstLines) && void 0 !== e ? e : 1
			};
		}
		buildCoercingContext(t, e, i) {
			void 0 === i && (i = 0);
			var r = (i, r) => {
				if (4 >= r) {
					var s = this.buildCoercingContext(t, e, r);
					return this.applyCoercers(i, s);
				}
			};
			return f({}, e, {
				syntheticException: 0 == i ? e.syntheticException : void 0,
				mechanism: t,
				apply: (t) => r(t, i),
				next: (t) => r(t, i + 1)
			});
		}
	};
	var ie = "?";
	function re(t, e, i, r, s) {
		var n = {
			platform: t,
			filename: e,
			function: "<anonymous>" === i ? ie : i,
			in_app: !0
		};
		return C(r) || (n.lineno = r), C(s) || (n.colno = s), n;
	}
	var se = (t, e) => {
		var i = -1 !== t.indexOf("safari-extension"), r = -1 !== t.indexOf("safari-web-extension");
		return i || r ? [-1 !== t.indexOf("@") ? t.split("@")[0] : ie, i ? "safari-extension:" + e : "safari-web-extension:" + e] : [t, e];
	}, ne = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i, oe = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i, ae = /\((\S*)(?::(\d+))(?::(\d+))\)/, le = (t, e) => {
		var i = ne.exec(t);
		if (i) {
			var [, r, s, n] = i;
			return re(e, r, ie, +s, +n);
		}
		var o = oe.exec(t);
		if (o) {
			if (o[2] && 0 === o[2].indexOf("eval")) {
				var a = ae.exec(o[2]);
				a && (o[2] = a[1], o[3] = a[2], o[4] = a[3]);
			}
			var [l, u] = se(o[1] || ie, o[2]);
			return re(e, u, l, o[3] ? +o[3] : void 0, o[4] ? +o[4] : void 0);
		}
	}, ue = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i, he = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i, de = (t, e) => {
		var i = ue.exec(t);
		if (i) {
			if (i[3] && i[3].indexOf(" > eval") > -1) {
				var r = he.exec(i[3]);
				r && (i[1] = i[1] || "eval", i[3] = r[1], i[4] = r[2], i[5] = "");
			}
			var s = i[3], n = i[1] || ie;
			return [n, s] = se(n, s), re(e, s, n, i[4] ? +i[4] : void 0, i[5] ? +i[5] : void 0);
		}
	}, ve = /\(error: (.*)\)/;
	var ce = class {
		match(t) {
			return this.isDOMException(t) || this.isDOMError(t);
		}
		coerce(t, e) {
			var i = A(t.stack);
			return {
				type: this.getType(t),
				value: this.getValue(t),
				stack: i ? t.stack : void 0,
				cause: t.cause ? e.next(t.cause) : void 0,
				synthetic: !1
			};
		}
		getType(t) {
			return this.isDOMError(t) ? "DOMError" : "DOMException";
		}
		getValue(t) {
			var e = t.name || (this.isDOMError(t) ? "DOMError" : "DOMException");
			return t.message ? e + ": " + t.message : e;
		}
		isDOMException(t) {
			return H(t, "DOMException");
		}
		isDOMError(t) {
			return H(t, "DOMError");
		}
	};
	var pe = class {
		match(t) {
			return ((t) => t instanceof Error)(t);
		}
		coerce(t, e) {
			return {
				type: this.getType(t),
				value: this.getMessage(t, e),
				stack: this.getStack(t),
				cause: t.cause ? e.next(t.cause) : void 0,
				synthetic: !1
			};
		}
		getType(t) {
			return t.name || t.constructor.name;
		}
		getMessage(t, e) {
			var i = t.message;
			return String(i.error && "string" == typeof i.error.message ? i.error.message : i);
		}
		getStack(t) {
			return t.stacktrace || t.stack || void 0;
		}
	};
	var fe = class {
		constructor() {}
		match(t) {
			return H(t, "ErrorEvent") && null != t.error;
		}
		coerce(t, e) {
			var i;
			return e.apply(t.error) || {
				type: "ErrorEvent",
				value: t.message,
				stack: null == (i = e.syntheticException) ? void 0 : i.stack,
				synthetic: !0
			};
		}
	};
	var _e = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
	var ge = class {
		match(t) {
			return "string" == typeof t;
		}
		coerce(t, e) {
			var i, [r, s] = this.getInfos(t);
			return {
				type: null != r ? r : "Error",
				value: null != s ? s : t,
				stack: null == (i = e.syntheticException) ? void 0 : i.stack,
				synthetic: !0
			};
		}
		getInfos(t) {
			var e = "Error", i = t, r = t.match(_e);
			return r && (e = r[1], i = r[2]), [e, i];
		}
	};
	var me = [
		"fatal",
		"error",
		"warning",
		"log",
		"info",
		"debug"
	];
	function be(t, e) {
		void 0 === e && (e = 40);
		var i = Object.keys(t);
		if (i.sort(), !i.length) return "[object has no keys]";
		for (var r = i.length; r > 0; r--) {
			var s = i.slice(0, r).join(", ");
			if (e >= s.length) return r === i.length ? s : s.length > e ? s.slice(0, e) + "..." : s;
		}
		return "";
	}
	var ye = class {
		match(t) {
			return "object" == typeof t && null !== t;
		}
		coerce(t, e) {
			var i, r = this.getErrorPropertyFromObject(t);
			return r ? e.apply(r) : {
				type: this.getType(t),
				value: this.getValue(t),
				stack: null == (i = e.syntheticException) ? void 0 : i.stack,
				level: this.isSeverityLevel(t.level) ? t.level : "error",
				synthetic: !0
			};
		}
		getType(t) {
			return q(t) ? t.constructor.name : "Error";
		}
		getValue(t) {
			if ("name" in t && "string" == typeof t.name) {
				var e = "'" + t.name + "' captured as exception";
				return "message" in t && "string" == typeof t.message && (e += " with message: '" + t.message + "'"), e;
			}
			if ("message" in t && "string" == typeof t.message) return t.message;
			var i = this.getObjectClassName(t);
			return (i && "Object" !== i ? "'" + i + "'" : "Object") + " captured as exception with keys: " + be(t);
		}
		isSeverityLevel(t) {
			return A(t) && !F(t) && me.indexOf(t) >= 0;
		}
		getErrorPropertyFromObject(t) {
			for (var e in t) if ({}.hasOwnProperty.call(t, e)) {
				var i = t[e];
				if (Jt(i)) return i;
			}
		}
		getObjectClassName(t) {
			try {
				var e = Object.getPrototypeOf(t);
				return e ? e.constructor.name : void 0;
			} catch (t) {
				return;
			}
		}
	};
	var we = class {
		match(t) {
			return q(t);
		}
		coerce(t, e) {
			var i, r = t.constructor.name;
			return {
				type: r,
				value: r + " captured as exception with keys: " + be(t),
				stack: null == (i = e.syntheticException) ? void 0 : i.stack,
				synthetic: !0
			};
		}
	};
	var xe = class {
		match(t) {
			return B(t);
		}
		coerce(t, e) {
			var i;
			return {
				type: "Error",
				value: "Primitive value captured as exception: " + String(t),
				stack: null == (i = e.syntheticException) ? void 0 : i.stack,
				synthetic: !0
			};
		}
	};
	var Ee = class {
		match(t) {
			return H(t, "PromiseRejectionEvent") || this.isCustomEventWrappingRejection(t);
		}
		isCustomEventWrappingRejection(t) {
			if (!q(t)) return !1;
			try {
				var e = t.detail;
				return null != e && "object" == typeof e && "reason" in e;
			} catch (t) {
				return !1;
			}
		}
		coerce(t, e) {
			var i, r = this.getUnhandledRejectionReason(t);
			return B(r) ? {
				type: "UnhandledRejection",
				value: "Non-Error promise rejection captured with value: " + String(r),
				stack: null == (i = e.syntheticException) ? void 0 : i.stack,
				synthetic: !0
			} : e.apply(r);
		}
		getUnhandledRejectionReason(t) {
			try {
				if ("reason" in t) return t.reason;
				if ("detail" in t && null != t.detail && "object" == typeof t.detail && "reason" in t.detail) return t.detail.reason;
			} catch (t) {}
			return t;
		}
	};
	var Se = "$message", $e = "$timestamp", Te = new Set([Se, $e]), ke = {
		enabled: !0,
		max_bytes: 32768
	};
	function Re(t) {
		var e;
		return t ? {
			enabled: null !== (e = t.enabled) && void 0 !== e ? e : ke.enabled,
			max_bytes: Oe(t.max_bytes, ke.max_bytes)
		} : f({}, ke);
	}
	var Pe = class {
		constructor(t) {
			this.Kt = [], this.Qt = 0, this.Bt = Re(t);
		}
		setConfig(t) {
			this.Bt = Re(t), this.er();
		}
		add(t) {
			var e = function(t) {
				var e = function(t) {
					var e = /* @__PURE__ */ new WeakSet();
					try {
						return JSON.stringify(t, ((t, i) => {
							if ("bigint" == typeof i) return i.toString();
							if ("function" != typeof i && "symbol" != typeof i) {
								if (i instanceof Date) return i.toISOString();
								if (i instanceof Error) return {
									name: i.name,
									message: i.message,
									stack: i.stack
								};
								if (i && "object" == typeof i) {
									if (e.has(i)) return "[Circular]";
									e.add(i);
								}
								return i;
							}
						}));
					} catch (t) {
						return;
					}
				}(t);
				if (e) try {
					var i = JSON.parse(e);
					if (!O(i)) return;
					var r = i, s = r[Se], n = r[$e];
					if (!A(s) || 0 === s.trim().length) return;
					if (!A(n) && !L(n)) return;
					return {
						step: r,
						json: e
					};
				} catch (t) {
					return;
				}
			}(t);
			if (e) {
				var i = function(t) {
					if ("undefined" != typeof TextEncoder) return new TextEncoder().encode(t).length;
					for (var e = encodeURIComponent(t), i = 0, r = 0; e.length > r; r++) "%" === e[r] ? (i += 1, r += 2) : i += 1;
					return i;
				}(e.json);
				i > this.Bt.max_bytes || (this.Kt.push({
					step: e.step,
					bytes: i
				}), this.Qt += i, this.er());
			}
		}
		getAttachable() {
			return this.Kt.map(((t) => t.step));
		}
		clear() {
			this.Kt = [], this.Qt = 0;
		}
		size() {
			return this.Kt.length;
		}
		er() {
			for (; this.Qt > this.Bt.max_bytes && this.Kt.length > 0;) {
				var t = this.Kt.shift();
				t && (this.Qt -= t.bytes);
			}
		}
	};
	function Oe(t, e) {
		if (!L(t) || t === Infinity || t === -Infinity) return e;
		var i = Math.floor(t);
		return 0 > i ? e : i;
	}
	var Ie = function(e, i) {
		var { debugEnabled: r } = void 0 === i ? {} : i, s = {
			C(i) {
				if (t && (v.DEBUG || h.POSTHOG_DEBUG || r) && !C(t.console) && t.console) {
					for (var s = ("__rrweb_original__" in t.console[i]) ? t.console[i].__rrweb_original__ : t.console[i], n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), a = 1; n > a; a++) o[a - 1] = arguments[a];
					s(e, ...o);
				}
			},
			debug() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				s.C("debug", ...e);
			},
			info() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				s.C("log", ...e);
			},
			warn() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				s.C("warn", ...e);
			},
			error() {
				for (var t = arguments.length, e = new Array(t), i = 0; t > i; i++) e[i] = arguments[i];
				s.C("error", ...e);
			},
			critical() {
				for (var t = arguments.length, i = new Array(t), r = 0; t > r; r++) i[r] = arguments[r];
				console.error(e, ...i);
			},
			uninitializedWarning(t) {
				s.error("You must initialize PostHog before calling " + t);
			},
			createLogger: (t, i) => Ie(e + " " + t, i)
		};
		return s;
	}, Ce = Ie("[PostHog.js]"), Ae = Ce.createLogger, Fe = Ae("[ExternalScriptsLoader]"), Me = (t, e, i) => {
		if (t.config.disable_external_dependency_loading) return Fe.warn(e + " was requested but loading of external scripts is disabled."), i("Loading of external scripts is disabled");
		var s = null == r ? void 0 : r.querySelectorAll("script");
		if (s) {
			for (var n, o = function() {
				if (s[a].src === e) {
					var t = s[a];
					return t.__posthog_loading_callback_fired ? { v: i() } : (t.addEventListener("load", ((e) => {
						t.__posthog_loading_callback_fired = !0, i(void 0, e);
					})), t.onerror = (t) => i(t), { v: void 0 });
				}
			}, a = 0; s.length > a; a++) if (n = o()) return n.v;
		}
		var l = () => {
			if (!r) return i("document not found");
			var s = r.createElement("script");
			if (s.type = "text/javascript", s.crossOrigin = "anonymous", s.src = e, s.onload = (t) => {
				s.__posthog_loading_callback_fired = !0, i(void 0, t);
			}, s.onerror = (t) => i(t), t.config.prepare_external_dependency_script && (s = t.config.prepare_external_dependency_script(s)), !s) return i("prepare_external_dependency_script returned null");
			if ("head" === t.config.external_scripts_inject_target) r.head.appendChild(s);
			else {
				var n, o = r.querySelectorAll("body > script");
				o.length > 0 ? null == (n = o[0].parentNode) || n.insertBefore(s, o[0]) : r.body.appendChild(s);
			}
		};
		null != r && r.body ? l() : r?.addEventListener("DOMContentLoaded", l);
	};
	h.__PosthogExtensions__ = h.__PosthogExtensions__ || {}, h.__PosthogExtensions__.loadExternalDependency = (t, e, i) => {
		if ("remote-config" !== e) {
			var r;
			if (t.config.__preview_external_dependency_versioned_paths) r = t.requestRouter.endpointFor("assets", "/static/" + t.version + "/" + e + ".js");
			else {
				var s = "/static/" + e + ".js?v=" + t.version;
				if ("toolbar" === e) {
					var n = 3e5;
					s = s + "&t=" + Math.floor(Date.now() / n) * n;
				}
				r = t.requestRouter.endpointFor("assets", s);
			}
			Me(t, r, i);
		} else Me(t, t.requestRouter.endpointFor("assets", "/array/" + t.config.token + "/config.js"), i);
	}, h.__PosthogExtensions__.loadSiteApp = (t, e, i) => {
		Me(t, t.requestRouter.endpointFor("api", e), i);
	};
	var De = "$people_distinct_id", Le = "$device_id", Ue = "__alias", Ne = "__timers", je = "$autocapture_disabled_server_side", ze = "$heatmaps_enabled_server_side", Be = "$exception_capture_enabled_server_side", He = "$error_tracking_suppression_rules", qe = "$error_tracking_capture_extension_exceptions", Ve = "$web_vitals_enabled_server_side", We = "$dead_clicks_enabled_server_side", Ge = "$product_tours_enabled_server_side", Ye = "$web_vitals_allowed_metrics", Je = "$session_recording_remote_config", Ke = "$replay_override_sampling", Xe = "$replay_override_linked_flag", Qe = "$replay_override_url_trigger", Ze = "$replay_override_event_trigger", ti = "$sesid", ei = "$session_is_sampled", ii = "$enabled_feature_flags", ri = "$active_feature_flags", si = "$early_access_features", ni = "$feature_flag_details", oi = "$feature_flag_payloads", ai = "$feature_flag_request_id", li = "$override_feature_flags", ui = "$override_feature_flag_payloads", hi = "$stored_person_properties", di = "$stored_group_properties", vi = "$surveys", ci = "$surveys_activated", pi = "ph_product_tours", fi = "$flag_call_reported", _i = "$flag_call_reported_session_id", gi = "$feature_flag_errors", mi = "$feature_flag_evaluated_at", bi = "$user_state", yi = "$client_session_props", wi = "$capture_rate_limit", xi = "$initial_campaign_params", Ei = "$initial_referrer_info", Si = "$initial_person_info", $i = "$epp", Ti = "__POSTHOG_TOOLBAR__", ki = "$posthog_cookieless", Ri = "$sdk_debug_extensions_init_method", Pi = "$sdk_debug_extensions_init_time_ms", Oi = "$sdk_debug_recording_script_not_loaded", Ii = "PostHog loadExternalDependency extension not found.", Ci = "on_reject", Ai = "always", Fi = "anonymous", Mi = "identified", Di = "identified_only", Li = "visibilitychange", Ui = "beforeunload", Ni = "$pageview", ji = "$pageleave", zi = "$identify", Bi = "$groupidentify";
	function Hi(t, e) {
		R(t) && t.forEach(e);
	}
	function qi(t, e) {
		if (!D(t)) if (R(t)) t.forEach(e);
		else if (j(t)) t.forEach(((t, i) => e(t, i)));
		else for (var i in t) T.call(t, i) && e(t[i], i);
	}
	var Vi = function(t) {
		for (var e = arguments.length, i = new Array(e > 1 ? e - 1 : 0), r = 1; e > r; r++) i[r - 1] = arguments[r];
		for (var s of i) for (var n in s) void 0 !== s[n] && (t[n] = s[n]);
		return t;
	};
	function Wi(t) {
		for (var e = Object.keys(t), i = e.length, r = new Array(i); i--;) r[i] = [e[i], t[e[i]]];
		return r;
	}
	var Gi = function(t) {
		try {
			return t();
		} catch (t) {
			return;
		}
	}, Yi = function(t) {
		return function() {
			try {
				for (var e = arguments.length, i = new Array(e), r = 0; e > r; r++) i[r] = arguments[r];
				return t.apply(this, i);
			} catch (t) {
				Ce.critical("Implementation error. Please turn on debug mode and open a ticket on https://app.posthog.com/home#panel=support%3Asupport%3A."), Ce.critical(t);
			}
		};
	}, Ji = function(t) {
		var e = {};
		return qi(t, (function(t, i) {
			(A(t) && t.length > 0 || L(t)) && (e[i] = t);
		})), e;
	};
	var Ki = [
		"herokuapp.com",
		"vercel.app",
		"netlify.app"
	];
	function Xi(t) {
		var e = null == t ? void 0 : t.hostname;
		if (!A(e)) return !1;
		var i = e.split(".").slice(-2).join(".");
		for (var r of Ki) if (i === r) return !1;
		return !0;
	}
	function Qi(t, e, i, r) {
		var { capture: s = !1, passive: n = !0 } = null != r ? r : {};
		t?.addEventListener(e, i, {
			capture: s,
			passive: n
		});
	}
	function Zi(t) {
		return "ph_toolbar_internal" === t.name;
	}
	Math.trunc || (Math.trunc = function(t) {
		return 0 > t ? Math.ceil(t) : Math.floor(t);
	}), Number.isInteger || (Number.isInteger = function(t) {
		return L(t) && isFinite(t) && Math.floor(t) === t;
	});
	var tr = class tr {
		constructor(t) {
			if (this.bytes = t, 16 !== t.length) throw new TypeError("not 128-bit length");
		}
		static fromFieldsV7(t, e, i, r) {
			if (!Number.isInteger(t) || !Number.isInteger(e) || !Number.isInteger(i) || !Number.isInteger(r) || 0 > t || 0 > e || 0 > i || 0 > r || t > 0xffffffffffff || e > 4095 || i > 1073741823 || r > 4294967295) throw new RangeError("invalid field value");
			var s = new Uint8Array(16);
			return s[0] = t / Math.pow(2, 40), s[1] = t / Math.pow(2, 32), s[2] = t / Math.pow(2, 24), s[3] = t / Math.pow(2, 16), s[4] = t / Math.pow(2, 8), s[5] = t, s[6] = 112 | e >>> 8, s[7] = e, s[8] = 128 | i >>> 24, s[9] = i >>> 16, s[10] = i >>> 8, s[11] = i, s[12] = r >>> 24, s[13] = r >>> 16, s[14] = r >>> 8, s[15] = r, new tr(s);
		}
		toString() {
			for (var t = "", e = 0; this.bytes.length > e; e++) t = t + (this.bytes[e] >>> 4).toString(16) + (15 & this.bytes[e]).toString(16), 3 !== e && 5 !== e && 7 !== e && 9 !== e || (t += "-");
			if (36 !== t.length) throw new Error("Invalid UUIDv7 was generated");
			return t;
		}
		clone() {
			return new tr(this.bytes.slice(0));
		}
		equals(t) {
			return 0 === this.compareTo(t);
		}
		compareTo(t) {
			for (var e = 0; 16 > e; e++) {
				var i = this.bytes[e] - t.bytes[e];
				if (0 !== i) return Math.sign(i);
			}
			return 0;
		}
	};
	var er = class {
		constructor() {
			this.I = 0, this.S = 0, this.k = new sr();
		}
		generate() {
			var t = this.generateOrAbort();
			if (C(t)) {
				this.I = 0;
				var e = this.generateOrAbort();
				if (C(e)) throw new Error("Could not generate UUID after timestamp reset");
				return e;
			}
			return t;
		}
		generateOrAbort() {
			var t = Date.now();
			if (t > this.I) this.I = t, this.A();
			else {
				if (this.I >= t + 1e4) return;
				this.S++, this.S > 4398046511103 && (this.I++, this.A());
			}
			return tr.fromFieldsV7(this.I, Math.trunc(this.S / Math.pow(2, 30)), this.S & Math.pow(2, 30) - 1, this.k.nextUint32());
		}
		A() {
			this.S = 1024 * this.k.nextUint32() + (1023 & this.k.nextUint32());
		}
	};
	var ir, rr = (t) => {
		if ("undefined" != typeof UUIDV7_DENY_WEAK_RNG && UUIDV7_DENY_WEAK_RNG) throw new Error("no cryptographically strong RNG available");
		for (var e = 0; t.length > e; e++) t[e] = 65536 * Math.trunc(65536 * Math.random()) + Math.trunc(65536 * Math.random());
		return t;
	};
	t && !C(t.crypto) && crypto.getRandomValues && (rr = (t) => crypto.getRandomValues(t));
	var sr = class {
		constructor() {
			this.T = new Uint32Array(8), this.N = Infinity;
		}
		nextUint32() {
			return this.T.length > this.N || (rr(this.T), this.N = 0), this.T[this.N++];
		}
	};
	var nr = () => or().toString(), or = () => (ir || (ir = new er())).generate(), ar = "", lr = /[a-z0-9][a-z0-9-]+\.[a-z]{2,}$/i;
	var ur = {
		R: () => !!r,
		B(t) {
			Ce.error("cookieStore error: " + t);
		},
		O(t) {
			if (r) {
				try {
					for (var e = t + "=", i = r.cookie.split(";").filter(((t) => t.length)), s = 0; i.length > s; s++) {
						for (var n = i[s]; " " == n.charAt(0);) n = n.substring(1, n.length);
						if (0 === n.indexOf(e)) return decodeURIComponent(n.substring(e.length, n.length));
					}
				} catch (t) {}
				return null;
			}
		},
		Z(t) {
			var e;
			try {
				e = JSON.parse(ur.O(t)) || {};
			} catch (t) {}
			return e;
		},
		M(t, e, i, s, n) {
			if (r) try {
				var o = "", a = "", l = function(t, e) {
					if (e) {
						var i = function(t, e) {
							if (void 0 === e && (e = r), ar) return ar;
							if (!e) return "";
							if (["localhost", "127.0.0.1"].includes(t)) return "";
							for (var i = t.split("."), s = Math.min(i.length, 8), n = "dmn_chk_" + nr(); !ar && s--;) {
								var o = i.slice(s).join("."), a = n + "=1;domain=." + o + ";path=/";
								e.cookie = a + ";max-age=3", e.cookie.includes(n) && (e.cookie = a + ";max-age=0", ar = o);
							}
							return ar;
						}(t);
						if (!i) {
							var s = ((t) => {
								var e = t.match(lr);
								return e ? e[0] : "";
							})(t);
							s !== i && Ce.info("Warning: cookie subdomain discovery mismatch", s, i), i = s;
						}
						return i ? "; domain=." + i : "";
					}
					return "";
				}(r.location.hostname, s);
				if (i) {
					var u = /* @__PURE__ */ new Date();
					u.setTime(u.getTime() + 864e5 * i), o = "; expires=" + u.toUTCString();
				}
				n && (a = "; secure");
				var h = t + "=" + encodeURIComponent(JSON.stringify(e)) + o + "; SameSite=Lax; path=/" + l + a;
				return h.length > 3686.4 && Ce.warn("cookieStore warning: large cookie, len=" + h.length), r.cookie = h, h;
			} catch (t) {
				return;
			}
		},
		F(t, e) {
			if (null != r && r.cookie) try {
				ur.M(t, "", -1, e);
			} catch (t) {
				return;
			}
		}
	}, hr = null, dr = {
		R() {
			if (!M(hr)) return hr;
			var e = !0;
			if (C(t)) e = !1;
			else try {
				var i = "__mplssupport__";
				dr.M(i, "xyz"), "\"xyz\"" !== dr.O(i) && (e = !1), dr.F(i);
			} catch (t) {
				e = !1;
			}
			return e || Ce.error("localStorage unsupported; falling back to cookie store"), hr = e, e;
		},
		B(t) {
			Ce.error("localStorage error: " + t);
		},
		O(e) {
			try {
				return null == t ? void 0 : t.localStorage.getItem(e);
			} catch (t) {
				dr.B(t);
			}
			return null;
		},
		Z(t) {
			try {
				return JSON.parse(dr.O(t)) || {};
			} catch (t) {}
			return null;
		},
		M(e, i) {
			try {
				t?.localStorage.setItem(e, JSON.stringify(i));
			} catch (t) {
				dr.B(t);
			}
		},
		F(e) {
			try {
				t?.localStorage.removeItem(e);
			} catch (t) {
				dr.B(t);
			}
		}
	}, vr = [
		Le,
		"distinct_id",
		ti,
		ei,
		$i,
		Si,
		bi
	], cr = {}, pr = {
		R: () => !0,
		B(t) {
			Ce.error("memoryStorage error: " + t);
		},
		O: (t) => cr[t] || null,
		Z: (t) => cr[t] || null,
		M(t, e) {
			cr[t] = e;
		},
		F(t) {
			delete cr[t];
		}
	}, fr = null, _r = {
		R() {
			if (!M(fr)) return fr;
			if (fr = !0, C(t)) fr = !1;
			else try {
				var e = "__support__";
				_r.M(e, "xyz"), "\"xyz\"" !== _r.O(e) && (fr = !1), _r.F(e);
			} catch (t) {
				fr = !1;
			}
			return fr;
		},
		B(t) {
			Ce.error("sessionStorage error: ", t);
		},
		O(e) {
			try {
				return null == t ? void 0 : t.sessionStorage.getItem(e);
			} catch (t) {
				_r.B(t);
			}
			return null;
		},
		Z(t) {
			try {
				return JSON.parse(_r.O(t)) || null;
			} catch (t) {}
			return null;
		},
		M(e, i) {
			try {
				t?.sessionStorage.setItem(e, JSON.stringify(i));
			} catch (t) {
				_r.B(t);
			}
		},
		F(e) {
			try {
				t?.sessionStorage.removeItem(e);
			} catch (t) {
				_r.B(t);
			}
		}
	};
	var gr = class {
		constructor(t) {
			this._instance = t;
		}
		get Bt() {
			return this._instance.config;
		}
		get consent() {
			return this.rr() ? 0 : this.ir;
		}
		isOptedOut() {
			return this.Bt.cookieless_mode === Ai || this.isRejected() || -1 === this.consent && this.Bt.cookieless_mode === Ci;
		}
		isOptedIn() {
			return !this.isOptedOut();
		}
		isExplicitlyOptedOut() {
			return 0 === this.consent;
		}
		isRejected() {
			return 0 === this.consent || -1 === this.consent && this.Bt.opt_out_capturing_by_default;
		}
		optInOut(t) {
			this.nr.M(this.sr, t ? 1 : 0, this.Bt.cookie_expiration, this.Bt.cross_subdomain_cookie, this.Bt.secure_cookie);
		}
		reset() {
			this.nr.F(this.sr, this.Bt.cross_subdomain_cookie);
		}
		get sr() {
			var { token: t, opt_out_capturing_cookie_prefix: e, consent_persistence_name: i } = this._instance.config;
			return i || (e ? e + t : "__ph_opt_in_out_" + t);
		}
		get ir() {
			var t = this.nr.O(this.sr);
			return W(t) ? 1 : w(G, t) ? 0 : -1;
		}
		get nr() {
			var t = this.Bt.opt_out_capturing_persistence_type, e = "localStorage" === t ? dr : ur;
			if (!this.ar || this.ar !== e) {
				this.ar = e;
				var i = "localStorage" === t ? ur : dr;
				i.O(this.sr) && (this.ar.O(this.sr) || this.optInOut(W(i.O(this.sr))), i.F(this.sr, this.Bt.cross_subdomain_cookie));
			}
			return this.ar;
		}
		rr() {
			return !!this.Bt.respect_dnt && [
				null == i ? void 0 : i.doNotTrack,
				null == i ? void 0 : i.msDoNotTrack,
				h.doNotTrack
			].some(((t) => W(t)));
		}
	};
	var mr = Ae("[Dead Clicks]"), br = () => !0, yr = (t) => {
		var e, i = !(null == (e = t.instance.persistence) || !e.get_property(We)), r = t.instance.config.capture_dead_clicks;
		return N(r) ? r : !!O(r) || i;
	};
	var wr = class {
		get lazyLoadedDeadClicksAutocapture() {
			return this.lr;
		}
		constructor(t, e, i) {
			this.instance = t, this.isEnabled = e, this.onCapture = i, this.startIfEnabledOrStop();
		}
		onRemoteConfig(t) {
			"captureDeadClicks" in t && (this.instance.persistence && this.instance.persistence.register({ [We]: t.captureDeadClicks }), this.startIfEnabledOrStop());
		}
		startIfEnabledOrStop() {
			this.isEnabled(this) ? this.ur((() => {
				this.hr();
			})) : this.stop();
		}
		ur(t) {
			var e, i;
			null != (e = h.__PosthogExtensions__) && e.initDeadClicksAutocapture && t(), null == (i = h.__PosthogExtensions__) || null == i.loadExternalDependency || i.loadExternalDependency(this.instance, "dead-clicks-autocapture", ((e) => {
				e ? mr.error("failed to load script", e) : t();
			}));
		}
		hr() {
			var t;
			if (r) {
				if (!this.lr && null != (t = h.__PosthogExtensions__) && t.initDeadClicksAutocapture) {
					var e = O(this.instance.config.capture_dead_clicks) ? this.instance.config.capture_dead_clicks : {};
					e.__onCapture = this.onCapture, this.lr = h.__PosthogExtensions__.initDeadClicksAutocapture(this.instance, e), this.lr.start(r), mr.info("starting...");
				}
			} else mr.error("`document` not found. Cannot start.");
		}
		stop() {
			this.lr && (this.lr.stop(), this.lr = void 0, mr.info("stopping..."));
		}
	};
	var xr = Ae("[SegmentIntegration]");
	var Er = "posthog-js";
	function Sr(t, e) {
		var { organization: i, projectId: r, prefix: s, severityAllowList: n = ["error"], sendExceptionsToPostHog: o = !0 } = void 0 === e ? {} : e;
		return (e) => {
			var a, l, u, h, d;
			if ("*" !== n && !n.includes(e.level) || !t.__loaded) return e;
			e.tags || (e.tags = {});
			var v = t.requestRouter.endpointFor("ui", "/project/" + t.config.token + "/person/" + t.get_distinct_id());
			e.tags["PostHog Person URL"] = v, t.sessionRecordingStarted() && (e.tags["PostHog Recording URL"] = t.get_session_replay_url({ withTimestamp: !0 }));
			var c, p = (null == (a = e.exception) ? void 0 : a.values) || [], _ = p.map(((t) => f({}, t, { stacktrace: t.stacktrace ? f({}, t.stacktrace, {
				type: "raw",
				frames: (t.stacktrace.frames || []).map(((t) => f({}, t, { platform: "web:javascript" })))
			}) : void 0 }))), g = {
				$exception_message: (null == (l = p[0]) ? void 0 : l.value) || e.message,
				$exception_type: null == (u = p[0]) ? void 0 : u.type,
				$exception_level: e.level,
				$exception_list: _,
				$sentry_event_id: e.event_id,
				$sentry_exception: e.exception,
				$sentry_exception_message: (null == (h = p[0]) ? void 0 : h.value) || e.message,
				$sentry_exception_type: null == (d = p[0]) ? void 0 : d.type,
				$sentry_tags: e.tags
			};
			return i && r && (g.$sentry_url = (s || "https://sentry.io/organizations/") + i + "/issues/?project=" + r + "&query=" + e.event_id), o && (null == (c = t.exceptions) || c.sendExceptionEvent(g)), e;
		};
	}
	var $r = class {
		constructor(t, e, i, r, s, n) {
			this.name = Er, this.setupOnce = function(o) {
				o(Sr(t, {
					organization: e,
					projectId: i,
					prefix: r,
					severityAllowList: s,
					sendExceptionsToPostHog: null == n || n
				}));
			};
		}
	};
	var Tr = class {
		constructor(t) {
			this.cr = (t, e, i) => {
				i && (i.noSessionId || i.activityTimeout || i.sessionPastMaximumLength) && (Ce.info("[PageViewManager] Session rotated, clearing pageview state", {
					sessionId: t,
					changeReason: i
				}), this.dr = void 0, this._instance.scrollManager.resetContext());
			}, this._instance = t, this.vr();
		}
		vr() {
			var t;
			this.pr = null == (t = this._instance.sessionManager) ? void 0 : t.onSessionId(this.cr);
		}
		destroy() {
			var t;
			null == (t = this.pr) || t.call(this), this.pr = void 0;
		}
		doPageView(e, i) {
			var r, s = this.gr(e, i);
			return this.dr = {
				pathname: null !== (r = null == t ? void 0 : t.location.pathname) && void 0 !== r ? r : "",
				pageViewId: i,
				timestamp: e
			}, this._instance.scrollManager.resetContext(), s;
		}
		doPageLeave(t) {
			var e;
			return this.gr(t, null == (e = this.dr) ? void 0 : e.pageViewId);
		}
		doEvent() {
			var t;
			return { $pageview_id: null == (t = this.dr) ? void 0 : t.pageViewId };
		}
		gr(t, e) {
			var i = this.dr;
			if (!i) return { $pageview_id: e };
			var r = {
				$pageview_id: e,
				$prev_pageview_id: i.pageViewId
			}, s = this._instance.scrollManager.getContext();
			if (s && !this._instance.config.disable_scroll_properties) {
				var { maxScrollHeight: n, lastScrollY: o, maxScrollY: a, maxContentHeight: l, lastContentY: u, maxContentY: h } = s;
				if (!(C(n) || C(o) || C(a) || C(l) || C(u) || C(h))) {
					n = Math.ceil(n), o = Math.ceil(o), a = Math.ceil(a), l = Math.ceil(l), u = Math.ceil(u), h = Math.ceil(h);
					var d = n > 1 ? Y(o / n, 0, 1, Ce) : 1, v = n > 1 ? Y(a / n, 0, 1, Ce) : 1, c = l > 1 ? Y(u / l, 0, 1, Ce) : 1, p = l > 1 ? Y(h / l, 0, 1, Ce) : 1;
					r = Vi(r, {
						$prev_pageview_last_scroll: o,
						$prev_pageview_last_scroll_percentage: d,
						$prev_pageview_max_scroll: a,
						$prev_pageview_max_scroll_percentage: v,
						$prev_pageview_last_content: u,
						$prev_pageview_last_content_percentage: c,
						$prev_pageview_max_content: h,
						$prev_pageview_max_content_percentage: p
					});
				}
			}
			return i.pathname && (r.$prev_pageview_pathname = i.pathname), i.timestamp && (r.$prev_pageview_duration = (t.getTime() - i.timestamp.getTime()) / 1e3), r;
		}
	};
	var kr = {
		[De]: { exposure: "hidden" },
		[Ue]: { exposure: "hidden" },
		__cmpns: { exposure: "hidden" },
		[Ne]: { exposure: "hidden" },
		[je]: { exposure: "event" },
		[ze]: { exposure: "hidden" },
		[Be]: { exposure: "event" },
		[He]: { exposure: "hidden" },
		[qe]: { exposure: "event" },
		[Ve]: { exposure: "event" },
		[We]: { exposure: "event" },
		[Ge]: { exposure: "hidden" },
		[Ye]: { exposure: "event" },
		[Je]: { exposure: "hidden" },
		$session_recording_enabled_server_side: { exposure: "hidden" },
		[ti]: { exposure: "hidden" },
		[ei]: { exposure: "event" },
		$session_past_minimum_duration: { exposure: "event" },
		$session_recording_url_trigger_activated_session: { exposure: "event" },
		$session_recording_event_trigger_activated_session: { exposure: "event" },
		$debug_first_full_snapshot_timestamp: { exposure: "event" },
		[ii]: {
			exposure: "derived",
			shouldSkipFromEventProperties: (t, e) => e(),
			transformToEventProperties(t) {
				if (!O(t)) return {};
				for (var e = {}, i = Object.keys(t), r = 0; i.length > r; r++) e["$feature/" + i[r]] = t[i[r]];
				return e;
			}
		},
		[ri]: { exposure: "event" },
		[si]: { exposure: "hidden" },
		[ni]: { exposure: "hidden" },
		[oi]: { exposure: "event" },
		[ai]: { exposure: "event" },
		[li]: { exposure: "event" },
		[ui]: { exposure: "hidden" },
		[hi]: { exposure: "hidden" },
		[di]: { exposure: "hidden" },
		[vi]: { exposure: "hidden" },
		[ci]: { exposure: "event" },
		[pi]: { exposure: "hidden" },
		$product_tours_activated: { exposure: "hidden" },
		$conversations_widget_session_id: { exposure: "event" },
		$conversations_ticket_id: { exposure: "event" },
		$conversations_widget_state: { exposure: "event" },
		$conversations_user_traits: { exposure: "event" },
		[fi]: { exposure: "hidden" },
		[_i]: { exposure: "hidden" },
		[gi]: { exposure: "hidden" },
		[mi]: { exposure: "hidden" },
		[bi]: { exposure: "hidden" },
		[yi]: { exposure: "hidden" },
		[wi]: { exposure: "hidden" },
		[xi]: { exposure: "hidden" },
		[Ei]: { exposure: "hidden" },
		[Si]: { exposure: "hidden" },
		[$i]: { exposure: "hidden" },
		[Ke]: { exposure: "event" },
		[Xe]: { exposure: "event" },
		[Qe]: { exposure: "event" },
		[Ze]: { exposure: "event" },
		[Ri]: { exposure: "event" },
		[Pi]: { exposure: "event" },
		[Oi]: { exposure: "event" },
		$sdk_debug_replay_event_trigger_status: { exposure: "event" },
		$sdk_debug_replay_linked_flag_trigger_status: { exposure: "event" },
		$sdk_debug_replay_matched_recording_trigger_groups: { exposure: "event" },
		$sdk_debug_replay_remote_trigger_matching_config: { exposure: "event" },
		$sdk_debug_replay_trigger_groups_count: { exposure: "event" },
		$sdk_debug_replay_url_trigger_status: { exposure: "event" },
		$session_recording_start_reason: { exposure: "event" }
	}, Rr = [
		["$posthog_sr_group_event_trigger_", { exposure: "hidden" }],
		["$posthog_sr_group_url_trigger_", { exposure: "hidden" }],
		["$posthog_sr_group_sampling_", { exposure: "hidden" }]
	], Pr = (t) => {
		var e = null == r ? void 0 : r.createElement("a");
		return C(e) ? null : (e.href = t, e);
	}, Or = function(t, e) {
		for (var i, r = ((t.split("#")[0] || "").split(/\?(.*)/)[1] || "").replace(/^\?+/g, "").split("&"), s = 0; r.length > s; s++) {
			var n = r[s].split("=");
			if (n[0] === e) {
				i = n;
				break;
			}
		}
		if (!R(i) || 2 > i.length) return "";
		var o = i[1];
		try {
			o = decodeURIComponent(o);
		} catch (t) {
			Ce.error("Skipping decoding for malformed query param: " + o);
		}
		return o.replace(/\+/g, " ");
	}, Ir = function(t, e, i) {
		if (!t || !e || !e.length) return t;
		for (var r = t.split("#"), s = r[1], n = (r[0] || "").split("?"), o = n[1], a = n[0], l = (o || "").split("&"), u = [], h = 0; l.length > h; h++) {
			var d = l[h].split("=");
			R(d) && (e.includes(d[0]) ? u.push(d[0] + "=" + i) : u.push(l[h]));
		}
		var v = a;
		return null != o && (v += "?" + u.join("&")), null != s && (v += "#" + s), v;
	}, Cr = function(t, e) {
		var i = t.match(new RegExp(e + "=([^&]*)"));
		return i ? i[1] : null;
	}, Ar = "https?://(.*)", Fr = [
		"gclid",
		"gclsrc",
		"dclid",
		"gbraid",
		"wbraid",
		"fbclid",
		"msclkid",
		"twclid",
		"li_fat_id",
		"igshid",
		"ttclid",
		"rdt_cid",
		"epik",
		"qclid",
		"sccid",
		"irclid",
		"_kx"
	], Mr = [
		"utm_source",
		"utm_medium",
		"utm_campaign",
		"utm_content",
		"utm_term",
		"gad_source",
		"mc_cid",
		...Fr
	], Dr = "<masked>", Lr = ["li_fat_id"];
	function Ur(t, e, i) {
		if (!r) return {};
		var s, n = e ? [...Fr, ...i || []] : [], o = Nr(Ir(r.URL, n, Dr), t);
		return Vi((s = {}, qi(Lr, (function(t) {
			var e = ur.O(t);
			s[t] = e || null;
		})), s), o);
	}
	function Nr(t, e) {
		var i = Mr.concat(e || []), r = {};
		return qi(i, (function(e) {
			r[e] = Or(t, e) || null;
		})), r;
	}
	function jr(t) {
		var e = function(t) {
			return t ? 0 === t.search(Ar + "google.([^/?]*)") ? "google" : 0 === t.search(Ar + "bing.com") ? "bing" : 0 === t.search(Ar + "yahoo.com") ? "yahoo" : 0 === t.search(Ar + "duckduckgo.com") ? "duckduckgo" : null : null;
		}(t), i = "yahoo" != e ? "q" : "p", s = {};
		if (!M(e)) {
			s.$search_engine = e;
			var n = r ? Or(r.referrer, i) : "";
			n.length && (s.ph_keyword = n);
		}
		return s;
	}
	function zr() {
		return navigator.language || navigator.userLanguage;
	}
	var Br = "$direct";
	function Hr() {
		return (null == r ? void 0 : r.referrer) || Br;
	}
	function qr(t, e) {
		var i = t ? [...Fr, ...e || []] : [], r = null == s ? void 0 : s.href.substring(0, 1e3);
		return {
			r: Hr().substring(0, 1e3),
			u: r ? Ir(r, i, Dr) : void 0
		};
	}
	function Vr(t) {
		var e, { r: i, u: r } = t, s = {
			$referrer: i,
			$referring_domain: null == i ? void 0 : i == Br ? Br : null == (e = Pr(i)) ? void 0 : e.host
		};
		if (r) {
			s.$current_url = r;
			var n = Pr(r);
			s.$host = null == n ? void 0 : n.host, s.$pathname = null == n ? void 0 : n.pathname;
			Vi(s, Nr(r));
		}
		if (i) Vi(s, jr(i));
		return s;
	}
	function Wr() {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone;
		} catch (t) {
			return;
		}
	}
	function Gr() {
		try {
			return (/* @__PURE__ */ new Date()).getTimezoneOffset();
		} catch (t) {
			return;
		}
	}
	var Yr = [
		"cookie",
		"localstorage",
		"localstorage+cookie",
		"sessionstorage",
		"memory"
	];
	var Jr = class {
		constructor(t, e) {
			this.Bt = t, this.props = {}, this.mr = !1, this.yr = ((t) => {
				var e = "";
				return t.token && (e = t.token.replace(/\+/g, "PL").replace(/\//g, "SL").replace(/=/g, "EQ")), t.persistence_name ? "ph_" + t.persistence_name : "ph_" + e + "_posthog";
			})(t), this.nr = this.br(t), this.load(), t.debug && Ce.info("Persistence loaded", t.persistence, f({}, this.props)), this.update_config(t, t, e), this.save();
		}
		isDisabled() {
			return !!this.wr;
		}
		br(e) {
			-1 === Yr.indexOf(e.persistence.toLowerCase()) && (Ce.critical("Unknown persistence type " + e.persistence + "; falling back to localStorage+cookie"), e.persistence = "localStorage+cookie");
			var i = function(e) {
				void 0 === e && (e = []);
				var i = [...vr, ...e];
				return f({}, dr, {
					Z(t) {
						try {
							var e = {};
							try {
								e = ur.Z(t) || {};
							} catch (t) {}
							var i = Vi(e, JSON.parse(dr.O(t) || "{}"));
							return dr.M(t, i), i;
						} catch (t) {}
						return null;
					},
					M(t, e, r, s, n, o) {
						try {
							dr.M(t, e, void 0, void 0, o);
							var a = {};
							i.forEach(((t) => {
								e[t] && (a[t] = e[t]);
							})), Object.keys(a).length && ur.M(t, a, r, s, n, o);
						} catch (t) {
							dr.B(t);
						}
					},
					F(e, i) {
						try {
							t?.localStorage.removeItem(e), ur.F(e, i);
						} catch (t) {
							dr.B(t);
						}
					}
				});
			}(e.cookie_persisted_properties || []), r = e.persistence.toLowerCase();
			return "localstorage" === r && dr.R() ? dr : "localstorage+cookie" === r && i.R() ? i : "sessionstorage" === r && _r.R() ? _r : "memory" === r ? pr : "cookie" === r ? ur : i.R() ? i : ur;
		}
		_r(t) {
			var e = null != t ? t : this.Bt.feature_flag_cache_ttl_ms;
			if (!e || 0 >= e) return !1;
			var i = this.props[mi];
			return !i || "number" != typeof i || Date.now() - i > e;
		}
		properties() {
			var t = {};
			return qi(this.props, ((e, i) => {
				var r = ((t) => {
					var e = kr[t];
					if (e) return e;
					for (var [i, r] of Rr) if (0 === t.indexOf(i)) return r;
				})(i);
				if ("derived" === (null == r ? void 0 : r.exposure)) {
					if (null != r.shouldSkipFromEventProperties && r.shouldSkipFromEventProperties(e, i === ii ? () => this._r() : () => !1)) return;
					r.transformToEventProperties && Vi(t, r.transformToEventProperties(e));
				} else r && "event" !== r.exposure || (t[i] = e);
			})), t;
		}
		load() {
			if (!this.wr) {
				var t = this.nr.Z(this.yr);
				t && (this.props = Vi({}, t));
			}
		}
		save() {
			this.wr || this.nr.M(this.yr, this.props, this.Ir, this.Cr, this.Sr, this.Bt.debug);
		}
		remove() {
			this.nr.F(this.yr, !1), this.nr.F(this.yr, !0);
		}
		clear() {
			this.remove(), this.props = {};
		}
		register_once(t, e, i) {
			if (O(t)) {
				C(e) && (e = "None"), this.Ir = C(i) ? this.kr : i;
				var r = !1;
				if (qi(t, ((t, i) => {
					this.props.hasOwnProperty(i) && this.props[i] !== e || (this.Tr(i, t), r = !0);
				})), r) return this.save(), !0;
			}
			return !1;
		}
		register(t, e) {
			if (O(t)) {
				this.Ir = C(e) ? this.kr : e;
				var i = !1;
				if (qi(t, ((e, r) => {
					t.hasOwnProperty(r) && this.props[r] !== e && (this.Tr(r, e), i = !0);
				})), i) return this.save(), !0;
			}
			return !1;
		}
		unregister(t) {
			t in this.props && (this.Ar(t), this.save());
		}
		update_campaign_params() {
			if (!this.mr) {
				var t = Ur(this.Bt.custom_campaign_params, this.Bt.mask_personal_data_properties, this.Bt.custom_personal_data_properties);
				I(Ji(t)) || this.register(t), this.mr = !0;
			}
		}
		update_search_keyword() {
			var t;
			this.register((t = null == r ? void 0 : r.referrer) ? jr(t) : {});
		}
		update_referrer_info() {
			var t;
			this.register_once({
				$referrer: Hr(),
				$referring_domain: null != r && r.referrer && (null == (t = Pr(r.referrer)) ? void 0 : t.host) || Br
			}, void 0);
		}
		set_initial_person_info() {
			this.props[xi] || this.props[Ei] || this.register_once({ [Si]: qr(this.Bt.mask_personal_data_properties, this.Bt.custom_personal_data_properties) }, void 0);
		}
		get_initial_props() {
			var t = {};
			qi([Ei, xi], ((e) => {
				var i = this.props[e];
				i && qi(i, (function(e, i) {
					t["$initial_" + E(i)] = e;
				}));
			}));
			var e, i, r = this.props[Si];
			if (r) Vi(t, (e = Vr(r), i = {}, qi(e, (function(t, e) {
				i["$initial_" + E(e)] = t;
			})), i));
			return t;
		}
		safe_merge(t) {
			return qi(this.props, (function(e, i) {
				i in t || (t[i] = e);
			})), t;
		}
		update_config(t, e, i) {
			if (this.kr = this.Ir = t.cookie_expiration, this.set_disabled(t.disable_persistence || !!i), this.set_cross_subdomain(t.cross_subdomain_cookie), this.set_secure(t.secure_cookie), t.persistence !== e.persistence || !((t, e) => {
				if (t.length !== e.length) return !1;
				var i = [...t].sort(), r = [...e].sort();
				return i.every(((t, e) => t === r[e]));
			})(t.cookie_persisted_properties || [], e.cookie_persisted_properties || [])) {
				var r = this.br(t), s = this.props;
				this.clear(), this.nr = r, this.props = s, this.save();
			}
		}
		set_disabled(t) {
			this.wr = t, this.wr ? this.remove() : this.save();
		}
		set_cross_subdomain(t) {
			t !== this.Cr && (this.Cr = t, this.remove(), this.save());
		}
		set_secure(t) {
			t !== this.Sr && (this.Sr = t, this.remove(), this.save());
		}
		set_event_timer(t, e) {
			var i = this.props[Ne] || {};
			i[t] = e, this.Tr(Ne, i), this.save();
		}
		remove_event_timer(t) {
			var e = this.props[Ne] || {}, i = e[t];
			return C(i) || (delete e[t], this.Tr(Ne, e), this.save()), i;
		}
		get_property(t) {
			return this.props[t];
		}
		set_property(t, e) {
			this.Tr(t, e), this.save();
		}
		Tr(t, e) {
			this.props[t] = e;
		}
		Ar(t) {
			delete this.props[t];
		}
	}, Kr = {
		Activation: "events",
		Cancellation: "cancelEvents"
	}, ts = {
		Popover: "popover",
		API: "api",
		Widget: "widget",
		ExternalSurvey: "external_survey"
	}, ss = {
		SHOWN: "survey shown",
		DISMISSED: "survey dismissed",
		SENT: "survey sent",
		ABANDONED: "survey abandoned"
	}, ns = {
		SURVEY_ID: "$survey_id",
		SURVEY_NAME: "$survey_name",
		SURVEY_RESPONSE: "$survey_response",
		SURVEY_ITERATION: "$survey_iteration",
		SURVEY_ITERATION_START_DATE: "$survey_iteration_start_date",
		SURVEY_PARTIALLY_COMPLETED: "$survey_partially_completed",
		SURVEY_SUBMISSION_ID: "$survey_submission_id",
		SURVEY_QUESTIONS: "$survey_questions",
		SURVEY_COMPLETED: "$survey_completed",
		PRODUCT_TOUR_ID: "$product_tour_id",
		SURVEY_LAST_SEEN_DATE: "$survey_last_seen_date",
		SURVEY_LANGUAGE: "$survey_language"
	}, os = {
		Popover: "popover",
		Inline: "inline"
	}, ls = {
		SHOWN: "product tour shown",
		DISMISSED: "product tour dismissed",
		COMPLETED: "product tour completed",
		STEP_SHOWN: "product tour step shown",
		STEP_COMPLETED: "product tour step completed",
		BUTTON_CLICKED: "product tour button clicked",
		STEP_SELECTOR_FAILED: "product tour step selector failed",
		BANNER_CONTAINER_SELECTOR_FAILED: "product tour banner container selector failed",
		BANNER_ACTION_CLICKED: "product tour banner action clicked"
	}, us = {
		TOUR_ID: "$product_tour_id",
		TOUR_NAME: "$product_tour_name",
		TOUR_ITERATION: "$product_tour_iteration",
		TOUR_RENDER_REASON: "$product_tour_render_reason",
		TOUR_STEP_ID: "$product_tour_step_id",
		TOUR_STEP_ORDER: "$product_tour_step_order",
		TOUR_STEP_TYPE: "$product_tour_step_type",
		TOUR_DISMISS_REASON: "$product_tour_dismiss_reason",
		TOUR_BUTTON_TEXT: "$product_tour_button_text",
		TOUR_BUTTON_ACTION: "$product_tour_button_action",
		TOUR_BUTTON_LINK: "$product_tour_button_link",
		TOUR_BUTTON_TOUR_ID: "$product_tour_button_tour_id",
		TOUR_STEPS_COUNT: "$product_tour_steps_count",
		TOUR_STEP_SELECTOR: "$product_tour_step_selector",
		TOUR_STEP_SELECTOR_FOUND: "$product_tour_step_selector_found",
		TOUR_STEP_ELEMENT_TAG: "$product_tour_step_element_tag",
		TOUR_STEP_ELEMENT_ID: "$product_tour_step_element_id",
		TOUR_STEP_ELEMENT_CLASSES: "$product_tour_step_element_classes",
		TOUR_STEP_ELEMENT_TEXT: "$product_tour_step_element_text",
		TOUR_ERROR: "$product_tour_error",
		TOUR_MATCHES_COUNT: "$product_tour_matches_count",
		TOUR_FAILURE_PHASE: "$product_tour_failure_phase",
		TOUR_WAITED_FOR_ELEMENT: "$product_tour_waited_for_element",
		TOUR_WAIT_DURATION_MS: "$product_tour_wait_duration_ms",
		TOUR_BANNER_SELECTOR: "$product_tour_banner_selector",
		TOUR_LINKED_SURVEY_ID: "$product_tour_linked_survey_id",
		USE_MANUAL_SELECTOR: "$use_manual_selector",
		INFERENCE_DATA_PRESENT: "$inference_data_present",
		TOUR_LAST_SEEN_DATE: "$product_tour_last_seen_date",
		TOUR_TYPE: "$product_tour_type"
	}, hs = Ae("[RateLimiter]");
	var ds = class {
		constructor(t) {
			this.serverLimits = {}, this.lastEventRateLimited = !1, this.checkForLimiting = (t) => {
				var e = t.text;
				if (e && e.length) try {
					(JSON.parse(e).quota_limited || []).forEach(((t) => {
						hs.info((t || "events") + " is quota limited."), this.serverLimits[t] = (/* @__PURE__ */ new Date()).getTime() + 6e4;
					}));
				} catch (t) {
					hs.warn("could not rate limit - continuing. Error: \"" + (null == t ? void 0 : t.message) + "\"", { text: e });
					return;
				}
			}, this.instance = t, this.lastEventRateLimited = this.clientRateLimitContext(!0).isRateLimited;
		}
		get captureEventsPerSecond() {
			var t;
			return (null == (t = this.instance.config.rate_limiting) ? void 0 : t.events_per_second) || 10;
		}
		get captureEventsBurstLimit() {
			var t;
			return Math.max((null == (t = this.instance.config.rate_limiting) ? void 0 : t.events_burst_limit) || 10 * this.captureEventsPerSecond, this.captureEventsPerSecond);
		}
		clientRateLimitContext(t) {
			var e, i, r;
			void 0 === t && (t = !1);
			var { captureEventsBurstLimit: s, captureEventsPerSecond: n } = this, o = (/* @__PURE__ */ new Date()).getTime(), a = null !== (e = null == (i = this.instance.persistence) ? void 0 : i.get_property(wi)) && void 0 !== e ? e : {
				tokens: s,
				last: o
			};
			a.tokens += (o - a.last) / 1e3 * n, a.last = o, a.tokens > s && (a.tokens = s);
			var l = 1 > a.tokens;
			return l || t || (a.tokens = Math.max(0, a.tokens - 1)), !l || this.lastEventRateLimited || t || this.instance.capture("$$client_ingestion_warning", { $$client_ingestion_warning_message: "posthog-js client rate limited. Config is set to " + n + " events per second and " + s + " events burst limit." }, { skip_client_rate_limiting: !0 }), this.lastEventRateLimited = l, null == (r = this.instance.persistence) || r.set_property(wi, a), {
				isRateLimited: l,
				remainingTokens: a.tokens
			};
		}
		isServerRateLimited(t) {
			var e = this.serverLimits[t || "events"] || !1;
			return !1 !== e && (/* @__PURE__ */ new Date()).getTime() < e;
		}
	};
	var vs = Ae("[RemoteConfig]");
	var cs = class {
		constructor(t) {
			this._instance = t;
		}
		get remoteConfig() {
			var t;
			return null == (t = h._POSTHOG_REMOTE_CONFIG) || null == (t = t[this._instance.config.token]) ? void 0 : t.config;
		}
		Er(t) {
			var e, i;
			null != (e = h.__PosthogExtensions__) && e.loadExternalDependency ? null == (i = h.__PosthogExtensions__) || null == i.loadExternalDependency || i.loadExternalDependency(this._instance, "remote-config", (() => t(this.remoteConfig))) : t();
		}
		Rr(t) {
			this._instance._send_request({
				method: "GET",
				url: this._instance.requestRouter.endpointFor("assets", "/array/" + this._instance.config.token + "/config"),
				callback(e) {
					t(e.json);
				}
			});
		}
		load() {
			try {
				if (this.remoteConfig) return vs.info("Using preloaded remote config", this.remoteConfig), this.Nr(this.remoteConfig), void this.Mr();
				if (this._instance.Fr()) return void vs.warn("Remote config is disabled. Falling back to local config.");
				this.Er(((t) => {
					if (!t) return vs.info("No config found after loading remote JS config. Falling back to JSON."), void this.Rr(((t) => {
						this.Nr(t), this.Mr();
					}));
					this.Nr(t), this.Mr();
				}));
			} catch (t) {
				vs.error("Error loading remote config", t);
			}
		}
		stop() {
			this.Or && (clearInterval(this.Or), this.Or = void 0);
		}
		refresh() {
			this._instance.Fr() || "hidden" === (null == r ? void 0 : r.visibilityState) || this._instance.reloadFeatureFlags();
		}
		Mr() {
			var t;
			if (!this.Or) {
				var e = null !== (t = this._instance.config.remote_config_refresh_interval_ms) && void 0 !== t ? t : 3e5;
				0 !== e && (this.Or = setInterval((() => {
					this.refresh();
				}), e));
			}
		}
		Nr(t) {
			var e;
			t || vs.error("Failed to fetch remote config from PostHog."), this._instance.Nr(null != t ? t : {}), !1 !== (null == t ? void 0 : t.hasFeatureFlags) && (this._instance.config.advanced_disable_feature_flags_on_first_load || null == (e = this._instance.featureFlags) || e.ensureFlagsLoaded());
		}
	}, fs = {
		GZipJS: "gzip-js",
		Base64: "base64"
	}, _s = Uint8Array, gs = Uint16Array, ms = Uint32Array, bs = new _s([
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		4,
		4,
		4,
		4,
		5,
		5,
		5,
		5,
		0,
		0,
		0,
		0
	]), ys = new _s([
		0,
		0,
		0,
		0,
		1,
		1,
		2,
		2,
		3,
		3,
		4,
		4,
		5,
		5,
		6,
		6,
		7,
		7,
		8,
		8,
		9,
		9,
		10,
		10,
		11,
		11,
		12,
		12,
		13,
		13,
		0,
		0
	]), ws = new _s([
		16,
		17,
		18,
		0,
		8,
		7,
		9,
		6,
		10,
		5,
		11,
		4,
		12,
		3,
		13,
		2,
		14,
		1,
		15
	]), xs = function(t, e) {
		for (var i = new gs(31), r = 0; 31 > r; ++r) i[r] = e += 1 << t[r - 1];
		var s = new ms(i[30]);
		for (r = 1; 30 > r; ++r) for (var n = i[r]; i[r + 1] > n; ++n) s[n] = n - i[r] << 5 | r;
		return [i, s];
	}, Es = xs(bs, 2), Ss = Es[1];
	Es[0][28] = 258, Ss[258] = 28;
	for (var $s = xs(ys, 0)[1], Ts = new gs(32768), ks = 0; 32768 > ks; ++ks) {
		var Rs = (43690 & ks) >>> 1 | (21845 & ks) << 1;
		Ts[ks] = ((65280 & (Rs = (61680 & (Rs = (52428 & Rs) >>> 2 | (13107 & Rs) << 2)) >>> 4 | (3855 & Rs) << 4)) >>> 8 | (255 & Rs) << 8) >>> 1;
	}
	var Ps = function(t, e, i) {
		for (var r = t.length, s = 0, n = new gs(e); r > s; ++s) ++n[t[s] - 1];
		var o, a = new gs(e);
		for (s = 0; e > s; ++s) a[s] = a[s - 1] + n[s - 1] << 1;
		if (i) {
			o = new gs(1 << e);
			var l = 15 - e;
			for (s = 0; r > s; ++s) if (t[s]) for (var u = s << 4 | t[s], h = e - t[s], d = a[t[s] - 1]++ << h, v = d | (1 << h) - 1; v >= d; ++d) o[Ts[d] >>> l] = u;
		} else for (o = new gs(r), s = 0; r > s; ++s) o[s] = Ts[a[t[s] - 1]++] >>> 15 - t[s];
		return o;
	}, Os = new _s(288);
	for (ks = 0; 144 > ks; ++ks) Os[ks] = 8;
	for (ks = 144; 256 > ks; ++ks) Os[ks] = 9;
	for (ks = 256; 280 > ks; ++ks) Os[ks] = 7;
	for (ks = 280; 288 > ks; ++ks) Os[ks] = 8;
	var Is = new _s(32);
	for (ks = 0; 32 > ks; ++ks) Is[ks] = 5;
	var Cs = Ps(Os, 9, 0), As = Ps(Is, 5, 0), Fs = function(t) {
		return (t / 8 >> 0) + (7 & t && 1);
	}, Ms = function(t, e, i) {
		(null == i || i > t.length) && (i = t.length);
		var r = new (t instanceof gs ? gs : t instanceof ms ? ms : _s)(i - e);
		return r.set(t.subarray(e, i)), r;
	}, Ds = function(t, e, i) {
		var r = e / 8 >> 0;
		t[r] |= i <<= 7 & e, t[r + 1] |= i >>> 8;
	}, Ls = function(t, e, i) {
		var r = e / 8 >> 0;
		t[r] |= i <<= 7 & e, t[r + 1] |= i >>> 8, t[r + 2] |= i >>> 16;
	}, Us = function(t, e) {
		for (var i = [], r = 0; t.length > r; ++r) t[r] && i.push({
			s: r,
			f: t[r]
		});
		var s = i.length, n = i.slice();
		if (!s) return [new _s(0), 0];
		if (1 == s) {
			var o = new _s(i[0].s + 1);
			return o[i[0].s] = 1, [o, 1];
		}
		i.sort((function(t, e) {
			return t.f - e.f;
		})), i.push({
			s: -1,
			f: 25001
		});
		var a = i[0], l = i[1], u = 0, h = 1, d = 2;
		for (i[0] = {
			s: -1,
			f: a.f + l.f,
			l: a,
			r: l
		}; h != s - 1;) a = i[i[d].f > i[u].f ? u++ : d++], l = i[u != h && i[d].f > i[u].f ? u++ : d++], i[h++] = {
			s: -1,
			f: a.f + l.f,
			l: a,
			r: l
		};
		var v = n[0].s;
		for (r = 1; s > r; ++r) n[r].s > v && (v = n[r].s);
		var c = new gs(v + 1), p = Ns(i[h - 1], c, 0);
		if (p > e) {
			r = 0;
			var f = 0, _ = p - e, g = 1 << _;
			for (n.sort((function(t, e) {
				return c[e.s] - c[t.s] || t.f - e.f;
			})); s > r; ++r) {
				var m = n[r].s;
				if (e >= c[m]) break;
				f += g - (1 << p - c[m]), c[m] = e;
			}
			for (f >>>= _; f > 0;) {
				var b = n[r].s;
				e > c[b] ? f -= 1 << e - c[b]++ - 1 : ++r;
			}
			for (; r >= 0 && f; --r) {
				var y = n[r].s;
				c[y] == e && (--c[y], ++f);
			}
			p = e;
		}
		return [new _s(c), p];
	}, Ns = function(t, e, i) {
		return -1 == t.s ? Math.max(Ns(t.l, e, i + 1), Ns(t.r, e, i + 1)) : e[t.s] = i;
	}, js = function(t) {
		for (var e = t.length; e && !t[--e];);
		for (var i = new gs(++e), r = 0, s = t[0], n = 1, o = function(t) {
			i[r++] = t;
		}, a = 1; e >= a; ++a) if (t[a] == s && a != e) ++n;
		else {
			if (!s && n > 2) {
				for (; n > 138; n -= 138) o(32754);
				n > 2 && (o(n > 10 ? n - 11 << 5 | 28690 : n - 3 << 5 | 12305), n = 0);
			} else if (n > 3) {
				for (o(s), --n; n > 6; n -= 6) o(8304);
				n > 2 && (o(n - 3 << 5 | 8208), n = 0);
			}
			for (; n--;) o(s);
			n = 1, s = t[a];
		}
		return [i.subarray(0, r), e];
	}, zs = function(t, e) {
		for (var i = 0, r = 0; e.length > r; ++r) i += t[r] * e[r];
		return i;
	}, Bs = function(t, e, i) {
		var r = i.length, s = Fs(e + 2);
		t[s] = 255 & r, t[s + 1] = r >>> 8, t[s + 2] = 255 ^ t[s], t[s + 3] = 255 ^ t[s + 1];
		for (var n = 0; r > n; ++n) t[s + n + 4] = i[n];
		return 8 * (s + 4 + r);
	}, Hs = function(t, e, i, r, s, n, o, a, l, u, h) {
		Ds(e, h++, i), ++s[256];
		for (var d = Us(s, 15), v = d[0], c = d[1], p = Us(n, 15), f = p[0], _ = p[1], g = js(v), m = g[0], b = g[1], y = js(f), w = y[0], x = y[1], E = new gs(19), S = 0; m.length > S; ++S) E[31 & m[S]]++;
		for (S = 0; w.length > S; ++S) E[31 & w[S]]++;
		for (var T = Us(E, 7), k = T[0], R = T[1], P = 19; P > 4 && !k[ws[P - 1]]; --P);
		var O, I, C, A, F = u + 5 << 3, M = zs(s, Os) + zs(n, Is) + o, D = zs(s, v) + zs(n, f) + o + 14 + 3 * P + zs(E, k) + (2 * E[16] + 3 * E[17] + 7 * E[18]);
		if (M >= F && D >= F) return Bs(e, h, t.subarray(l, l + u));
		if (Ds(e, h, 1 + (M > D)), h += 2, M > D) {
			O = Ps(v, c, 0), I = v, C = Ps(f, _, 0), A = f;
			var L = Ps(k, R, 0);
			for (Ds(e, h, b - 257), Ds(e, h + 5, x - 1), Ds(e, h + 10, P - 4), h += 14, S = 0; P > S; ++S) Ds(e, h + 3 * S, k[ws[S]]);
			h += 3 * P;
			for (var U = [m, w], N = 0; 2 > N; ++N) {
				var j = U[N];
				for (S = 0; j.length > S; ++S) Ds(e, h, L[z = 31 & j[S]]), h += k[z], z > 15 && (Ds(e, h, j[S] >>> 5 & 127), h += j[S] >>> 12);
			}
		} else O = Cs, I = Os, C = As, A = Is;
		for (S = 0; a > S; ++S) if (r[S] > 255) {
			var z;
			Ls(e, h, O[257 + (z = r[S] >>> 18 & 31)]), h += I[z + 257], z > 7 && (Ds(e, h, r[S] >>> 23 & 31), h += bs[z]);
			var B = 31 & r[S];
			Ls(e, h, C[B]), h += A[B], B > 3 && (Ls(e, h, r[S] >>> 5 & 8191), h += ys[B]);
		} else Ls(e, h, O[r[S]]), h += I[r[S]];
		return Ls(e, h, O[256]), h + I[256];
	}, qs = new ms([
		65540,
		131080,
		131088,
		131104,
		262176,
		1048704,
		1048832,
		2114560,
		2117632
	]), Vs = function() {
		for (var t = new ms(256), e = 0; 256 > e; ++e) {
			for (var i = e, r = 9; --r;) i = (1 & i && 3988292384) ^ i >>> 1;
			t[e] = i;
		}
		return t;
	}(), Ws = function(t, e, i) {
		for (; i; ++e) t[e] = i, i >>>= 8;
	};
	function Gs(t, e) {
		void 0 === e && (e = {});
		var i = function() {
			var t = 4294967295;
			return {
				p(e) {
					for (var i = t, r = 0; e.length > r; ++r) i = Vs[255 & i ^ e[r]] ^ i >>> 8;
					t = i;
				},
				d() {
					return 4294967295 ^ t;
				}
			};
		}(), r = t.length;
		i.p(t);
		var s, n, o, a, l, u = (a = 10 + ((s = e).filename && s.filename.length + 1 || 0), l = 8, function(t, e, i, r, s, n) {
			var o = t.length, a = new _s(r + o + 5 * (1 + Math.floor(o / 7e3)) + s), l = a.subarray(r, a.length - s), u = 0;
			if (!e || 8 > o) for (var h = 0; o >= h; h += 65535) {
				var d = h + 65535;
				o > d ? u = Bs(l, u, t.subarray(h, d)) : (l[h] = !0, u = Bs(l, u, t.subarray(h, o)));
			}
			else {
				for (var v = qs[e - 1], c = v >>> 13, p = 8191 & v, f = (1 << i) - 1, _ = new gs(32768), g = new gs(f + 1), m = Math.ceil(i / 3), b = 2 * m, y = function(e) {
					return (t[e] ^ t[e + 1] << m ^ t[e + 2] << b) & f;
				}, w = new ms(25e3), x = new gs(288), E = new gs(32), S = 0, T = 0, k = (h = 0, 0), R = 0, P = 0; o > h; ++h) {
					var O = y(h), I = 32767 & h, C = g[O];
					if (_[I] = C, g[O] = I, h >= R) {
						var A = o - h;
						if ((S > 7e3 || k > 24576) && A > 423) {
							u = Hs(t, l, 0, w, x, E, T, k, P, h - P, u), k = S = T = 0, P = h;
							for (var F = 0; 286 > F; ++F) x[F] = 0;
							for (F = 0; 30 > F; ++F) E[F] = 0;
						}
						var M = 2, D = 0, L = p, U = I - C & 32767;
						if (A > 2 && O == y(h - U)) for (var N = Math.min(c, A) - 1, j = Math.min(32767, h), z = Math.min(258, A); j >= U && --L && I != C;) {
							if (t[h + M] == t[h + M - U]) {
								for (var B = 0; z > B && t[h + B] == t[h + B - U]; ++B);
								if (B > M) {
									if (M = B, D = U, B > N) break;
									var H = Math.min(U, B - 2), q = 0;
									for (F = 0; H > F; ++F) {
										var V = h - U + F + 32768 & 32767, W = V - _[V] + 32768 & 32767;
										W > q && (q = W, C = V);
									}
								}
							}
							U += (I = C) - (C = _[I]) + 32768 & 32767;
						}
						if (D) {
							w[k++] = 268435456 | Ss[M] << 18 | $s[D];
							var G = 31 & Ss[M], Y = 31 & $s[D];
							T += bs[G] + ys[Y], ++x[257 + G], ++E[Y], R = h + M, ++S;
						} else w[k++] = t[h], ++x[t[h]];
					}
				}
				u = Hs(t, l, !0, w, x, E, T, k, P, h - P, u);
			}
			return Ms(a, 0, r + Fs(u) + s);
		}(n = t, null == (o = e).level ? 6 : o.level, null == o.mem ? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(n.length)))) : 12 + o.mem, a, l)), h = u.length;
		return function(t, e) {
			var i = e.filename;
			if (t[0] = 31, t[1] = 139, t[2] = 8, t[8] = 2 > e.level ? 4 : 9 == e.level ? 2 : 0, t[9] = 3, 0 != e.mtime && Ws(t, 4, Math.floor(new Date(e.mtime || Date.now()) / 1e3)), i) {
				t[3] = 8;
				for (var r = 0; i.length >= r; ++r) t[r + 10] = i.charCodeAt(r);
			}
		}(u, e), Ws(u, h - 8, i.d()), Ws(u, h - 4, r), u;
	}
	var Ys = !!o || !!n, Js = "text/plain", Ks = !1, Xs = function(t, e, i) {
		var r;
		void 0 === i && (i = !0);
		var [s, n] = t.split("?"), o = f({}, e), a = null !== (r = null == n ? void 0 : n.split("&").map(((t) => {
			var e, [r, s] = t.split("="), n = i && null !== (e = o[r]) && void 0 !== e ? e : s;
			return delete o[r], r + "=" + n;
		}))) && void 0 !== r ? r : [], l = function(t, e) {
			var i, r;
			void 0 === e && (e = "&");
			var s = [];
			return qi(t, (function(t, e) {
				C(t) || C(e) || "undefined" === e || (i = encodeURIComponent(((t) => t instanceof File)(t) ? t.name : t.toString()), r = encodeURIComponent(e), s[s.length] = r + "=" + i);
			})), s.join(e);
		}(o);
		return l && a.push(l), s + "?" + a.join("&");
	}, Qs = (t, e) => JSON.stringify(t, ((t, e) => "bigint" == typeof e ? e.toString() : e), e), Zs = (t) => {
		if (t.tr) return t.tr;
		var { data: e, compression: i } = t;
		if (e) {
			if (i === fs.GZipJS) {
				var r = Gs(function(t, e) {
					var i = t.length;
					if ("undefined" != typeof TextEncoder) return new TextEncoder().encode(t);
					for (var r = new _s(t.length + (t.length >>> 1)), s = 0, n = function(t) {
						r[s++] = t;
					}, o = 0; i > o; ++o) {
						if (s + 5 > r.length) {
							var a = new _s(s + 8 + (i - o << 1));
							a.set(r), r = a;
						}
						var l = t.charCodeAt(o);
						128 > l ? n(l) : 2048 > l ? (n(192 | l >>> 6), n(128 | 63 & l)) : l > 55295 && 57344 > l ? (n(240 | (l = 65536 + (1047552 & l) | 1023 & t.charCodeAt(++o)) >>> 18), n(128 | l >>> 12 & 63), n(128 | l >>> 6 & 63), n(128 | 63 & l)) : (n(224 | l >>> 12), n(128 | l >>> 6 & 63), n(128 | 63 & l));
					}
					return Ms(r, 0, s);
				}(Qs(e)), { mtime: 0 });
				return {
					contentType: Js,
					body: r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength),
					estimatedSize: r.byteLength
				};
			}
			if (i === fs.Base64) {
				var n = ((t) => "data=" + encodeURIComponent("string" == typeof t ? t : Qs(t)))(function(t) {
					return t ? btoa(encodeURIComponent(t).replace(/%([0-9A-F]{2})/g, ((t, e) => String.fromCharCode(parseInt(e, 16))))) : t;
				}(Qs(e)));
				return {
					contentType: "application/x-www-form-urlencoded",
					body: n,
					estimatedSize: new Blob([n]).size
				};
			}
			var o = Qs(e);
			return {
				contentType: "application/json",
				body: o,
				estimatedSize: new Blob([o]).size
			};
		}
	}, tn = function() {
		var t = p((function* (t) {
			var i = yield function(t, e, i) {
				return g.apply(this, arguments);
			}(Qs(t.data), v.DEBUG, { rethrow: !0 });
			if (!i) return t;
			var r = yield i.arrayBuffer();
			return f({}, t, { tr: {
				contentType: Js,
				body: r,
				estimatedSize: r.byteLength
			} });
		}));
		return function(e) {
			return t.apply(this, arguments);
		};
	}(), en = (t, e) => Xs(t, {
		_: (/* @__PURE__ */ new Date()).getTime().toString(),
		ver: v.JS_SDK_VERSION,
		compression: e
	}), rn = [];
	n && rn.push({
		transport: "fetch",
		method(t) {
			var e, i, { contentType: r, body: s, estimatedSize: o } = null !== (e = Zs(t)) && void 0 !== e ? e : {}, l = new Headers();
			qi(t.headers, (function(t, e) {
				l.append(e, t);
			})), r && l.append("Content-Type", r);
			var u = t.url, h = null;
			if (a) {
				var d = new a();
				h = {
					signal: d.signal,
					timeout: setTimeout((() => d.abort()), t.timeout)
				};
			}
			n(u, f({
				method: (null == t ? void 0 : t.method) || "GET",
				headers: l,
				keepalive: "POST" === t.method && 52428.8 > (o || 0),
				body: s,
				signal: null == (i = h) ? void 0 : i.signal
			}, t.fetchOptions)).then(((e) => e.text().then(((i) => {
				var r = {
					statusCode: e.status,
					text: i
				};
				if (200 === e.status) try {
					r.json = JSON.parse(i);
				} catch (t) {
					Ce.error(t);
				}
				null == t.callback || t.callback(r);
			})))).catch(((e) => {
				Ce.error(e), null == t.callback || t.callback({
					statusCode: 0,
					error: e
				});
			})).finally((() => h ? clearTimeout(h.timeout) : null));
		}
	}), o && rn.push({
		transport: "XHR",
		method(t) {
			var e, i = new o();
			i.open(t.method || "GET", t.url, !0);
			var { contentType: r, body: s } = null !== (e = Zs(t)) && void 0 !== e ? e : {};
			qi(t.headers, (function(t, e) {
				i.setRequestHeader(e, t);
			})), r && i.setRequestHeader("Content-Type", r), t.timeout && (i.timeout = t.timeout), t.disableXHRCredentials || (i.withCredentials = !0), i.onreadystatechange = () => {
				if (4 === i.readyState) {
					var e = {
						statusCode: i.status,
						text: i.responseText
					};
					if (200 === i.status) try {
						e.json = JSON.parse(i.responseText);
					} catch (t) {}
					null == t.callback || t.callback(e);
				}
			}, i.send(s);
		}
	}), null != i && i.sendBeacon && rn.push({
		transport: "sendBeacon",
		method(t) {
			var e = Xs(t.url, { beacon: "1" });
			try {
				var r, { contentType: s, body: n } = null !== (r = Zs(t)) && void 0 !== r ? r : {};
				if (!n) return;
				var o = n instanceof Blob ? n : new Blob([n], { type: s });
				i.sendBeacon(e, o);
			} catch (t) {}
		}
	});
	var sn = 3e3;
	var nn = class {
		constructor(t, e) {
			this.Pr = !0, this.Lr = [], this.Dr = Y((null == e ? void 0 : e.flush_interval_ms) || sn, 250, 5e3, Ce.createLogger("flush interval"), sn), this.Br = t;
		}
		enqueue(t) {
			this.Lr.push(t), this.jr || this.$r();
		}
		unload() {
			this.qr();
			var t = this.Lr.length > 0 ? this.Zr() : {}, e = Object.values(t);
			[...e.filter(((t) => 0 === t.url.indexOf("/e"))), ...e.filter(((t) => 0 !== t.url.indexOf("/e")))].map(((t) => {
				this.Br(f({}, t, { transport: "sendBeacon" }));
			}));
		}
		enable() {
			this.Pr = !1, this.$r();
		}
		$r() {
			var t = this;
			this.Pr || (this.jr = setTimeout((() => {
				if (this.qr(), this.Lr.length > 0) {
					var e = this.Zr(), i = function() {
						var i = e[r], s = (/* @__PURE__ */ new Date()).getTime();
						i.data && R(i.data) && qi(i.data, ((t) => {
							t.offset = Math.abs(t.timestamp - s), delete t.timestamp;
						})), t.Br(i);
					};
					for (var r in e) i();
				}
			}), this.Dr));
		}
		qr() {
			clearTimeout(this.jr), this.jr = void 0;
		}
		Zr() {
			var t = {};
			return qi(this.Lr, ((e) => {
				var i, r = e, s = (r ? r.batchKey : null) || r.url;
				C(t[s]) && (t[s] = f({}, r, { data: [] })), null == (i = t[s].data) || i.push(r.data);
			})), this.Lr = [], t;
		}
	};
	var on = ["retriesPerformedSoFar"];
	var an = class {
		constructor(e) {
			this.Hr = !1, this.Vr = 3e3, this.Lr = [], this._instance = e, this.Lr = [], this.zr = !0, !C(t) && "onLine" in t.navigator && (this.zr = t.navigator.onLine, this.Ur = () => {
				this.zr = !0, this.Yr();
			}, this.Gr = () => {
				this.zr = !1;
			}, Qi(t, "online", this.Ur), Qi(t, "offline", this.Gr));
		}
		get length() {
			return this.Lr.length;
		}
		retriableRequest(t) {
			var { retriesPerformedSoFar: e } = t, i = _(t, on);
			U(e) && (i.url = Xs(i.url, { retry_count: e })), this._instance._send_request(f({}, i, { callback: (t) => {
				200 === t.statusCode || t.statusCode >= 400 && 500 > t.statusCode || (null != e ? e : 0) >= 10 ? null == i.callback || i.callback(t) : this.Wr(f({ retriesPerformedSoFar: e }, i));
			} }));
		}
		Wr(t) {
			var e = t.retriesPerformedSoFar || 0;
			t.retriesPerformedSoFar = e + 1;
			var i = function(t) {
				var e = 3e3 * Math.pow(2, t), i = e / 2, r = Math.min(18e5, e), s = Math.random() - .5;
				return Math.ceil(r + s * (r - i));
			}(e), r = Date.now() + i;
			this.Lr.push({
				retryAt: r,
				requestOptions: t
			});
			var s = "Enqueued failed request for retry in " + i;
			navigator.onLine || (s += " (Browser is offline)"), Ce.warn(s), this.Hr || (this.Hr = !0, this.Xr());
		}
		Xr() {
			if (this.Jr && clearTimeout(this.Jr), 0 === this.Lr.length) return this.Hr = !1, void (this.Jr = void 0);
			this.Jr = setTimeout((() => {
				this.zr && this.Lr.length > 0 && this.Yr(), this.Xr();
			}), this.Vr);
		}
		Yr() {
			var t = Date.now(), e = [], i = this.Lr.filter(((i) => t > i.retryAt || (e.push(i), !1)));
			if (this.Lr = e, i.length > 0) for (var { requestOptions: r } of i) this.retriableRequest(r);
		}
		unload() {
			for (var { requestOptions: e } of (this.Jr && (clearTimeout(this.Jr), this.Jr = void 0), this.Hr = !1, C(t) || (this.Ur && (t.removeEventListener("online", this.Ur), this.Ur = void 0), this.Gr && (t.removeEventListener("offline", this.Gr), this.Gr = void 0)), this.Lr)) try {
				this._instance._send_request(f({}, e, { transport: "sendBeacon" }));
			} catch (t) {
				Ce.error(t);
			}
			this.Lr = [];
		}
	};
	var ln = class {
		constructor(t) {
			this.Kr = () => {
				var t, e, i, r;
				this.Qr || (this.Qr = {});
				var s = this.scrollElement(), n = this.scrollY(), o = s ? Math.max(0, s.scrollHeight - s.clientHeight) : 0, a = n + ((null == s ? void 0 : s.clientHeight) || 0), l = (null == s ? void 0 : s.scrollHeight) || 0;
				this.Qr.lastScrollY = Math.ceil(n), this.Qr.maxScrollY = Math.max(n, null !== (t = this.Qr.maxScrollY) && void 0 !== t ? t : 0), this.Qr.maxScrollHeight = Math.max(o, null !== (e = this.Qr.maxScrollHeight) && void 0 !== e ? e : 0), this.Qr.lastContentY = a, this.Qr.maxContentY = Math.max(a, null !== (i = this.Qr.maxContentY) && void 0 !== i ? i : 0), this.Qr.maxContentHeight = Math.max(l, null !== (r = this.Qr.maxContentHeight) && void 0 !== r ? r : 0);
			}, this._instance = t;
		}
		get ei() {
			return this._instance.config.scroll_root_selector;
		}
		getContext() {
			return this.Qr;
		}
		resetContext() {
			var t = this.Qr;
			return setTimeout(this.Kr, 0), t;
		}
		startMeasuringScrollPosition() {
			Qi(t, "scroll", this.Kr, { capture: !0 }), Qi(t, "scrollend", this.Kr, { capture: !0 }), Qi(t, "resize", this.Kr);
		}
		scrollElement() {
			if (!this.ei) return null == t ? void 0 : t.document.documentElement;
			for (var i of R(this.ei) ? this.ei : [this.ei]) {
				var r = null == t ? void 0 : t.document.querySelector(i);
				if (r) return r;
			}
		}
		scrollY() {
			if (this.ei) {
				var e = this.scrollElement();
				return e && e.scrollTop || 0;
			}
			return t && (t.scrollY || t.pageYOffset || t.document.documentElement.scrollTop) || 0;
		}
		scrollX() {
			if (this.ei) {
				var e = this.scrollElement();
				return e && e.scrollLeft || 0;
			}
			return t && (t.scrollX || t.pageXOffset || t.document.documentElement.scrollLeft) || 0;
		}
	};
	var un = (t) => qr(null == t ? void 0 : t.config.mask_personal_data_properties, null == t ? void 0 : t.config.custom_personal_data_properties);
	var hn = class {
		constructor(t, e, i, r) {
			this.ti = (t) => {
				var e = this.ri();
				if (!e || e.sessionId !== t) {
					var i = {
						sessionId: t,
						props: this.ii(this._instance)
					};
					this.ni.register({ [yi]: i });
				}
			}, this._instance = t, this.si = e, this.ni = i, this.ii = r || un, this.si.onSessionId(this.ti);
		}
		ri() {
			return this.ni.props[yi];
		}
		getSetOnceProps() {
			var t, e = null == (t = this.ri()) ? void 0 : t.props;
			return e ? "r" in e ? Vr(e) : {
				$referring_domain: e.referringDomain,
				$pathname: e.initialPathName,
				utm_source: e.utm_source,
				utm_campaign: e.utm_campaign,
				utm_medium: e.utm_medium,
				utm_content: e.utm_content,
				utm_term: e.utm_term
			} : {};
		}
		getSessionProps() {
			var t = {};
			return qi(Ji(this.getSetOnceProps()), ((e, i) => {
				"$current_url" === i && (i = "url"), t["$session_entry_" + E(i)] = e;
			})), t;
		}
	};
	var dn = class {
		constructor() {
			this.oi = {};
		}
		on(t, e) {
			return this.oi[t] || (this.oi[t] = []), this.oi[t].push(e), () => {
				this.oi[t] = this.oi[t].filter(((t) => t !== e));
			};
		}
		emit(t, e) {
			for (var i of this.oi[t] || []) i(e);
			for (var r of this.oi["*"] || []) r(t, e);
		}
	};
	var vn = Ae("[SessionId]");
	var cn = class {
		on(t, e) {
			return this.ai.on(t, e);
		}
		constructor(t, e, i) {
			var r;
			if (this.li = [], this.ui = void 0, this.ai = new dn(), this.hi = (t, e) => !(!U(t) || !U(e)) && Math.abs(t - e) > this.sessionTimeoutMs, !t.persistence) throw new Error("SessionIdManager requires a PostHogPersistence instance");
			if (t.config.cookieless_mode === Ai) throw new Error("SessionIdManager cannot be used with cookieless_mode=\"always\"");
			this.Bt = t.config, this.ni = t.persistence, this.ci = void 0, this.di = void 0, this._sessionStartTimestamp = null, this._sessionActivityTimestamp = null, this.vi = e || nr, this.fi = i || nr;
			var s = this.Bt.persistence_name || this.Bt.token;
			if (this._sessionTimeoutMs = 1e3 * Y(this.Bt.session_idle_timeout_seconds || 1800, 60, 36e3, vn.createLogger("session_idle_timeout_seconds"), 1800), t.register({ $configured_session_timeout_ms: this._sessionTimeoutMs }), this.pi(), this.gi = "ph_" + s + "_window_id", this.mi = "ph_" + s + "_primary_window_exists", this.yi()) {
				var n = _r.Z(this.gi), o = _r.Z(this.mi);
				n && !o ? this.ci = n : _r.F(this.gi), _r.M(this.mi, !0);
			}
			if (null != (r = this.Bt.bootstrap) && r.sessionID) try {
				var a = ((t) => {
					var e = this.Bt.bootstrap.sessionID.replace(/-/g, "");
					if (32 !== e.length) throw new Error("Not a valid UUID");
					if ("7" !== e[12]) throw new Error("Not a UUIDv7");
					return parseInt(e.substring(0, 12), 16);
				})();
				this.bi(this.Bt.bootstrap.sessionID, (/* @__PURE__ */ new Date()).getTime(), a);
			} catch (t) {
				vn.error("Invalid sessionID in bootstrap", t);
			}
			this.wi();
		}
		get sessionTimeoutMs() {
			return this._sessionTimeoutMs;
		}
		onSessionId(t) {
			return C(this.li) && (this.li = []), this.li.push(t), this.di && t(this.di, this.ci), () => {
				this.li = this.li.filter(((e) => e !== t));
			};
		}
		yi() {
			return "memory" !== this.Bt.persistence && !this.ni.wr && _r.R();
		}
		Ii(t) {
			t !== this.ci && (this.ci = t, this.yi() && _r.M(this.gi, t));
		}
		Ci() {
			return this.ci ? this.ci : this.yi() ? _r.Z(this.gi) : null;
		}
		bi(t, e, i) {
			t === this.di && e === this._sessionActivityTimestamp && i === this._sessionStartTimestamp || (this._sessionStartTimestamp = i, this._sessionActivityTimestamp = e, this.di = t, this.ni.register({ [ti]: [
				e,
				t,
				i
			] }));
		}
		Si() {
			var t = this.ni.props[ti];
			return R(t) && 2 === t.length && t.push(t[0]), t || [
				0,
				null,
				0
			];
		}
		resetSessionId() {
			this.bi(null, null, null);
		}
		destroy() {
			clearTimeout(this.xi), this.xi = void 0, this.ui && t && (t.removeEventListener(Ui, this.ui, { capture: !1 }), this.ui = void 0), this.li = [];
		}
		wi() {
			this.ui = () => {
				this.yi() && _r.F(this.mi);
			}, Qi(t, Ui, this.ui, { capture: !1 });
		}
		checkAndGetSessionAndWindowId(t, e) {
			if (void 0 === t && (t = !1), void 0 === e && (e = null), this.Bt.cookieless_mode === Ai) throw new Error("checkAndGetSessionAndWindowId should not be called with cookieless_mode=\"always\"");
			var i = e || (/* @__PURE__ */ new Date()).getTime(), [r, s, n] = this.Si(), o = this.Ci(), a = U(n) && Math.abs(i - n) > 864e5, l = !1, u = !s, h = !u && !t && this.hi(i, r);
			u || h || a ? (s = this.vi(), o = this.fi(), vn.info("new session ID generated", {
				sessionId: s,
				windowId: o,
				changeReason: {
					noSessionId: u,
					activityTimeout: h,
					sessionPastMaximumLength: a
				}
			}), n = i, l = !0) : o || (o = this.fi(), l = !0);
			var d = U(r) && t && !a ? r : i, v = U(n) ? n : (/* @__PURE__ */ new Date()).getTime();
			return this.Ii(o), this.bi(s, d, v), t || this.pi(), l && this.li.forEach(((t) => t(s, o, l ? {
				noSessionId: u,
				activityTimeout: h,
				sessionPastMaximumLength: a
			} : void 0))), {
				sessionId: s,
				windowId: o,
				sessionStartTimestamp: v,
				changeReason: l ? {
					noSessionId: u,
					activityTimeout: h,
					sessionPastMaximumLength: a
				} : void 0,
				lastActivityTimestamp: r
			};
		}
		pi() {
			clearTimeout(this.xi), this.xi = setTimeout((() => {
				var [t] = this.Si();
				if (this.hi((/* @__PURE__ */ new Date()).getTime(), t)) {
					var e = this.di;
					this.resetSessionId(), this.ai.emit("forcedIdleReset", { idleSessionId: e });
				}
			}), 1.1 * this.sessionTimeoutMs);
		}
	};
	var pn = function(t, e) {
		if (!t) return !1;
		var i = t.userAgent;
		if (i && b(i, e)) return !0;
		try {
			var r = null == t ? void 0 : t.userAgentData;
			if (null != r && r.brands && r.brands.some(((t) => b(null == t ? void 0 : t.brand, e)))) return !0;
		} catch (t) {}
		return !!t.webdriver;
	}, fn = function(t, e) {
		if (!function(t) {
			try {
				new RegExp(t);
			} catch (t) {
				return !1;
			}
			return !0;
		}(e)) return !1;
		try {
			return new RegExp(e).test(t);
		} catch (t) {
			return !1;
		}
	};
	function _n(t, e, i) {
		return Qs({
			distinct_id: t,
			userPropertiesToSet: e,
			userPropertiesToSetOnce: i
		});
	}
	var gn = {
		exact: (t, e) => e.some(((e) => t.some(((t) => e === t)))),
		is_not: (t, e) => e.every(((e) => t.every(((t) => e !== t)))),
		regex: (t, e) => e.some(((e) => t.some(((t) => fn(e, t))))),
		not_regex: (t, e) => e.every(((e) => t.every(((t) => !fn(e, t))))),
		icontains: (t, e) => e.map(mn).some(((e) => t.map(mn).some(((t) => e.includes(t))))),
		not_icontains: (t, e) => e.map(mn).every(((e) => t.map(mn).every(((t) => !e.includes(t))))),
		gt: (t, e) => e.some(((e) => {
			var i = parseFloat(e);
			return !isNaN(i) && t.some(((t) => i > parseFloat(t)));
		})),
		lt: (t, e) => e.some(((e) => {
			var i = parseFloat(e);
			return !isNaN(i) && t.some(((t) => i < parseFloat(t)));
		}))
	}, mn = (t) => t.toLowerCase();
	function bn(t, e) {
		return !t || Object.entries(t).every(((t) => {
			var [i, r] = t, s = null == e ? void 0 : e[i];
			if (C(s) || M(s)) return !1;
			var n = [String(s)], o = gn[r.operator];
			return !!o && o(r.values, n);
		}));
	}
	var yn, wn, xn = "custom", En = "i.posthog.com", Sn = /^\/static\//;
	var $n = class {
		constructor(t) {
			this.ki = {}, this.instance = t;
		}
		get apiHost() {
			var t = this.instance.config.api_host.trim().replace(/\/$/, "");
			return "https://app.posthog.com" === t ? "https://us.i.posthog.com" : t;
		}
		get flagsApiHost() {
			var t = this.instance.config.flags_api_host;
			return t ? t.trim().replace(/\/$/, "") : this.apiHost;
		}
		get uiHost() {
			var t, e = null == (t = this.instance.config.ui_host) ? void 0 : t.replace(/\/$/, "");
			return e || (e = this.apiHost.replace("." + En, ".posthog.com")), "https://app.posthog.com" === e ? "https://us.posthog.com" : e;
		}
		get region() {
			return this.ki[this.apiHost] || (this.ki[this.apiHost] = /https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? "us" : /https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? "eu" : xn), this.ki[this.apiHost];
		}
		Ti(t) {
			var e = this.instance.config.__preview_external_dependency_versioned_paths;
			if ("string" == typeof e && Sn.test(t)) return e.trim().replace(/\/$/, "") || void 0;
		}
		endpointFor(t, e) {
			if (void 0 === e && (e = ""), e && (e = "/" === e[0] ? e : "/" + e), "ui" === t) return this.uiHost + e;
			if ("flags" === t) return this.flagsApiHost + e;
			if ("assets" === t) {
				var i = this.Ti(e);
				if (i) return "" + i + e;
			}
			if (this.region === xn) return this.apiHost + e;
			var r = En + e;
			switch (t) {
				case "assets": return "https://" + this.region + "-assets." + r;
				case "api": return "https://" + this.region + "." + r;
			}
		}
	};
	void 0 === yn && (yn = (t) => t()), Z("[SurveyTranslations]", yn, (void 0 === wn && (wn = console), {
		log: wn.log.bind(wn),
		warn: wn.warn.bind(wn),
		error: wn.error.bind(wn),
		debug: wn.debug.bind(wn)
	}));
	var Tn = Ae("[Surveys]"), kn = "seenSurvey_", Rn = [
		ts.Popover,
		ts.Widget,
		ts.API
	], Pn = {
		ignoreConditions: !1,
		ignoreDelay: !1,
		displayType: os.Popover
	}, On = Ae("[PostHog ExternalIntegrations]"), In = {
		intercom: "intercom-integration",
		crispChat: "crisp-chat-integration"
	};
	var Cn = class {
		constructor(t) {
			this._instance = t;
		}
		ur(t, e) {
			var i;
			null == (i = h.__PosthogExtensions__) || null == i.loadExternalDependency || i.loadExternalDependency(this._instance, t, ((t) => {
				if (t) return On.error("failed to load script", t);
				e();
			}));
		}
		startIfEnabledOrStop() {
			var t = this, e = function(e) {
				var i, s, n;
				!r || null != (i = h.__PosthogExtensions__) && null != (i = i.integrations) && i[e] || t.ur(In[e], (() => {
					var i;
					null == (i = h.__PosthogExtensions__) || null == (i = i.integrations) || null == (i = i[e]) || i.start(t._instance);
				})), !r && null != (s = h.__PosthogExtensions__) && null != (s = s.integrations) && s[e] && (null == (n = h.__PosthogExtensions__) || null == (n = n.integrations) || null == (n = n[e]) || n.stop());
			};
			for (var [i, r] of Object.entries(null !== (s = this._instance.config.integrations) && void 0 !== s ? s : {})) {
				var s;
				e(i);
			}
		}
	};
	var An, Fn = {}, Mn = 0, Dn = () => {}, Ln = "Consent opt in/out is not valid with cookieless_mode=\"always\" and will be ignored", Un = "Surveys module not available", Nn = "sanitize_properties is deprecated. Use before_send instead", jn = "Invalid value for property_denylist config: ", zn = "posthog", Bn = !Ys && -1 === (null == u ? void 0 : u.indexOf("MSIE")) && -1 === (null == u ? void 0 : u.indexOf("Mozilla")), Hn = (e) => {
		var i;
		return f({
			api_host: "https://us.i.posthog.com",
			flags_api_host: null,
			ui_host: null,
			token: "",
			autocapture: !0,
			cross_subdomain_cookie: Xi(null == r ? void 0 : r.location),
			persistence: "localStorage+cookie",
			persistence_name: "",
			cookie_persisted_properties: [],
			loaded: Dn,
			save_campaign_params: !0,
			custom_campaign_params: [],
			custom_blocked_useragents: [],
			save_referrer: !0,
			capture_pageleave: "if_capture_pageview",
			defaults: null != e ? e : "unset",
			__preview_deferred_init_extensions: !1,
			__preview_external_dependency_versioned_paths: !1,
			debug: s && A(null == s ? void 0 : s.search) && -1 !== s.search.indexOf("__posthog_debug=true") || !1,
			cookie_expiration: 365,
			upgrade: !1,
			disable_session_recording: !1,
			disable_persistence: !1,
			disable_web_experiments: !0,
			disable_surveys: !1,
			disable_surveys_automatic_display: !1,
			disable_conversations: !1,
			disable_product_tours: !1,
			disable_external_dependency_loading: !1,
			enable_recording_console_log: void 0,
			secure_cookie: "https:" === (null == t || null == (i = t.location) ? void 0 : i.protocol),
			ip: !1,
			opt_out_capturing_by_default: !1,
			opt_out_persistence_by_default: !1,
			opt_out_useragent_filter: !1,
			opt_out_capturing_persistence_type: "localStorage",
			consent_persistence_name: null,
			opt_out_capturing_cookie_prefix: null,
			opt_in_site_apps: !1,
			property_denylist: [],
			respect_dnt: !1,
			sanitize_properties: null,
			request_headers: {},
			request_batching: !0,
			properties_string_max_length: 65535,
			mask_all_element_attributes: !1,
			mask_all_text: !1,
			mask_personal_data_properties: !1,
			custom_personal_data_properties: [],
			advanced_disable_flags: !1,
			advanced_disable_decide: !1,
			advanced_disable_feature_flags: !1,
			advanced_disable_feature_flags_on_first_load: !1,
			advanced_only_evaluate_survey_feature_flags: !1,
			advanced_feature_flags_dedup_per_session: !1,
			advanced_enable_surveys: !1,
			advanced_disable_toolbar_metrics: !1,
			feature_flag_request_timeout_ms: 3e3,
			surveys_request_timeout_ms: 1e4,
			on_request_error(t) {
				Ce.error("Bad HTTP status: " + t.statusCode + " " + t.text);
			},
			get_device_id: (t) => t,
			capture_performance: void 0,
			name: "posthog",
			bootstrap: {},
			disable_compression: !1,
			session_idle_timeout_seconds: 1800,
			person_profiles: Di,
			before_send: void 0,
			request_queue_config: { flush_interval_ms: sn },
			error_tracking: {},
			_onCapture: Dn,
			__preview_eager_load_replay: !1
		}, ((t) => ({
			rageclick: !t || "2025-11-30" > t || { content_ignorelist: !0 },
			capture_pageview: !t || "2025-05-24" > t || "history_change",
			session_recording: t && t >= "2025-11-30" ? { strictMinimumDuration: !0 } : {},
			external_scripts_inject_target: t && t >= "2026-01-30" ? "head" : "body",
			internal_or_test_user_hostname: t && t >= "2026-01-30" ? /^(localhost|127\.0\.0\.1)$/ : void 0
		}))(e));
	}, qn = [
		["process_person", "person_profiles"],
		["xhr_headers", "request_headers"],
		["cookie_name", "persistence_name"],
		["disable_cookie", "disable_persistence"],
		["store_google", "save_campaign_params"],
		["verbose", "debug"]
	], Vn = (t) => {
		var e = {};
		for (var [i, r] of qn) C(t[i]) || (e[r] = t[i]);
		var s = Vi({}, e, t);
		return R(t.property_blacklist) && (C(t.property_denylist) ? s.property_denylist = t.property_blacklist : R(t.property_denylist) ? s.property_denylist = [...t.property_blacklist, ...t.property_denylist] : Ce.error(jn + t.property_denylist)), s;
	};
	var Wn = class {
		constructor() {
			this.__forceAllowLocalhost = !1;
		}
		get Ai() {
			return this.__forceAllowLocalhost;
		}
		set Ai(t) {
			Ce.error("WebPerformanceObserver is deprecated and has no impact on network capture. Use `_forceAllowLocalhostNetworkCapture` on `posthog.sessionRecording`"), this.__forceAllowLocalhost = t;
		}
	};
	var Gn = class Gn {
		Ei(t, e) {
			if (t) {
				var i = this.Ri.indexOf(t);
				-1 !== i && this.Ri.splice(i, 1);
			}
			return this.Ri.push(e), null == e.initialize || e.initialize(), e;
		}
		Ni() {
			return this.config.cookieless_mode === Ai || this.config.cookieless_mode === Ci && this.consent.isRejected();
		}
		get decideEndpointWasHit() {
			var t, e;
			return null !== (t = null == (e = this.featureFlags) ? void 0 : e.hasLoadedFlags) && void 0 !== t && t;
		}
		get flagsEndpointWasHit() {
			var t, e;
			return null !== (t = null == (e = this.featureFlags) ? void 0 : e.hasLoadedFlags) && void 0 !== t && t;
		}
		constructor() {
			var t;
			this.webPerformance = new Wn(), this.Mi = !1, this.version = v.LIB_VERSION, this.Fi = new dn(), this.Ri = [], this._calculate_event_properties = this.calculateEventProperties.bind(this), this.config = Hn(), this.SentryIntegration = $r, this.sentryIntegration = (t) => function(t, e) {
				var i = Sr(t, e);
				return {
					name: Er,
					processEvent: (t) => i(t)
				};
			}(this, t), this.__request_queue = [], this.__loaded = !1, this.analyticsDefaultEndpoint = "/e/", this.Oi = !1, this.Pi = null, this.Li = null, this.Di = null, this.scrollManager = new ln(this), this.pageViewManager = new Tr(this), this.rateLimiter = new ds(this), this.requestRouter = new $n(this), this.consent = new gr(this), this.externalIntegrations = new Cn(this);
			var e = null !== (t = Gn.__defaultExtensionClasses) && void 0 !== t ? t : {};
			this.featureFlags = e.featureFlags && new e.featureFlags(this), this.toolbar = e.toolbar && new e.toolbar(this), this.surveys = e.surveys && new e.surveys(this), this.conversations = e.conversations && new e.conversations(this), this.logs = e.logs && new e.logs(this), this.experiments = e.experiments && new e.experiments(this), this.exceptions = e.exceptions && new e.exceptions(this), this.people = {
				set: (t, e, i) => {
					var r = A(t) ? { [t]: e } : t;
					this.setPersonProperties(r), i?.({});
				},
				set_once: (t, e, i) => {
					var r = A(t) ? { [t]: e } : t;
					this.setPersonProperties(void 0, r), i?.({});
				}
			}, this.on("eventCaptured", ((t) => Ce.info("send \"" + (null == t ? void 0 : t.event) + "\"", t)));
		}
		init(t, e, i) {
			if (i && i !== zn) {
				var r, s = null !== (r = Fn[i]) && void 0 !== r ? r : new Gn();
				return s._init(t, e, i), Fn[i] = s, Fn[zn][i] = s, s;
			}
			return this._init(t, e, i);
		}
		_init(e, i, r) {
			var s, n;
			if (void 0 === i && (i = {}), C(e) || F(e)) return Ce.critical("PostHog was initialized without a token. This likely indicates a misconfiguration. Please check the first argument passed to posthog.init()"), this;
			if (this.__loaded) return console.warn("[PostHog.js]", "You have already initialized PostHog! Re-initializing is a no-op"), this;
			this.__loaded = !0, this.config = {}, i.debug = this.Bi(i.debug), this.ji = i, this.$i = [], i.person_profiles ? this.Li = i.person_profiles : i.process_person && (this.Li = i.process_person), this.set_config(Vi({}, Hn(i.defaults), Vn(i), {
				name: r,
				token: e
			})), this.config.on_xhr_error && Ce.error("on_xhr_error is deprecated. Use on_request_error instead"), this.compression = i.disable_compression ? void 0 : fs.GZipJS;
			var o = this.qi();
			this.persistence = new Jr(this.config, o), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new Jr(f({}, this.config, { persistence: "sessionStorage" }), o);
			var a = f({}, this.persistence.props), l = f({}, this.sessionPersistence.props);
			this.register({ $initialization_time: (/* @__PURE__ */ new Date()).toISOString() }), this.Zi = new nn(((t) => this.Hi(t)), this.config.request_queue_config), this.Vi = new an(this), this.__request_queue = [];
			var u = this.Ni();
			if (u || (this.sessionManager = new cn(this), this.sessionPropsManager = new hn(this, this.sessionManager, this.persistence)), this.config.__preview_deferred_init_extensions ? (Ce.info("Deferring extension initialization to improve startup performance"), setTimeout((() => {
				this.zi(u);
			}), 0)) : (Ce.info("Initializing extensions synchronously"), this.zi(u)), v.DEBUG = v.DEBUG || this.config.debug, v.DEBUG && Ce.info("Starting in debug mode", {
				this: this,
				config: i,
				thisC: f({}, this.config),
				p: a,
				s: l
			}), !this.config.identity_distinct_id || null != (s = i.bootstrap) && s.distinctID || (i.bootstrap = f({}, i.bootstrap, {
				distinctID: this.config.identity_distinct_id,
				isIdentifiedID: !0
			})), void 0 !== (null == (n = i.bootstrap) ? void 0 : n.distinctID)) {
				var h = i.bootstrap.distinctID, d = this.get_distinct_id(), c = this.persistence.get_property(bi);
				if (i.bootstrap.isIdentifiedID && null != d && d !== h && c === Fi) this.identify(h);
				else if (i.bootstrap.isIdentifiedID && null != d && d !== h && c === Mi) Ce.warn("Bootstrap distinctID differs from an already-identified user. The existing identity is preserved. Call reset() before reinitializing if you intend to switch users.");
				else {
					var p = this.config.get_device_id(nr()), _ = i.bootstrap.isIdentifiedID ? p : h;
					this.persistence.set_property(bi, i.bootstrap.isIdentifiedID ? Mi : Fi), this.register({
						distinct_id: h,
						$device_id: _
					});
				}
			}
			if (u) this.register_once({
				distinct_id: ki,
				$device_id: null
			}, "");
			else if (!this.get_distinct_id()) {
				var g = this.config.get_device_id(nr());
				this.register_once({
					distinct_id: g,
					$device_id: g
				}, ""), this.persistence.set_property(bi, Fi);
			}
			return Qi(t, "onpagehide" in self ? "pagehide" : "unload", this._handle_unload.bind(this), { passive: !1 }), i.segment ? function(t, e) {
				var i = t.config.segment;
				if (!i) return e();
				(function(t, e) {
					var i = t.config.segment;
					if (!i) return e();
					var r = (i) => {
						var r = () => i.anonymousId() || nr();
						t.config.get_device_id = r, i.id() && (t.register({
							distinct_id: i.id(),
							$device_id: r()
						}), t.persistence.set_property(bi, Mi)), e();
					}, s = i.user();
					"then" in s && P(s.then) ? s.then(r) : r(s);
				})(t, (() => {
					i.register(((t) => {
						Promise && Promise.resolve || xr.warn("This browser does not have Promise support, and can not use the segment integration");
						var e = (e, i) => {
							if (!i) return e;
							e.event.userId || e.event.anonymousId === t.get_distinct_id() || (xr.info("No userId set, resetting PostHog"), t.reset()), e.event.userId && e.event.userId !== t.get_distinct_id() && (xr.info("UserId set, identifying with PostHog"), t.identify(e.event.userId));
							var r = t.calculateEventProperties(i, e.event.properties);
							return e.event.properties = Object.assign({}, r, e.event.properties), e;
						};
						return {
							name: "PostHog JS",
							type: "enrichment",
							version: "1.0.0",
							isLoaded: () => !0,
							load: () => Promise.resolve(),
							track: (t) => e(t, t.event.event),
							page: (t) => e(t, Ni),
							identify: (t) => e(t, zi),
							screen: (t) => e(t, "$screen")
						};
					})(t)).then((() => {
						e();
					}));
				}));
			}(this, (() => this.Ui())) : this.Ui(), P(this.config._onCapture) && this.config._onCapture !== Dn && (Ce.warn("onCapture is deprecated. Please use `before_send` instead"), this.on("eventCaptured", ((t) => this.config._onCapture(t.event, t)))), this.config.ip && Ce.warn("The `ip` config option has NO EFFECT AT ALL and has been deprecated. Use a custom transformation or \"Discard IP data\" project setting instead. See https://posthog.com/tutorials/web-redact-properties#hiding-customer-ip-address for more information."), this;
		}
		zi(t) {
			var e, i, r, s, n, o, a, l = performance.now(), u = f({}, Gn.__defaultExtensionClasses, this.config.__extensionClasses), h = [];
			u.featureFlags && this.Ri.push(this.featureFlags = null !== (e = this.featureFlags) && void 0 !== e ? e : new u.featureFlags(this)), u.exceptions && this.Ri.push(this.exceptions = null !== (i = this.exceptions) && void 0 !== i ? i : new u.exceptions(this)), u.historyAutocapture && this.Ri.push(this.historyAutocapture = new u.historyAutocapture(this)), u.tracingHeaders && this.Ri.push(new u.tracingHeaders(this)), u.siteApps && this.Ri.push(this.siteApps = new u.siteApps(this)), u.sessionRecording && !t && this.Ri.push(this.sessionRecording = new u.sessionRecording(this)), this.config.disable_scroll_properties || h.push((() => {
				this.scrollManager.startMeasuringScrollPosition();
			})), u.autocapture && this.Ri.push(this.autocapture = new u.autocapture(this)), u.surveys && this.Ri.push(this.surveys = null !== (r = this.surveys) && void 0 !== r ? r : new u.surveys(this)), u.logs && this.Ri.push(this.logs = null !== (s = this.logs) && void 0 !== s ? s : new u.logs(this)), u.conversations && this.Ri.push(this.conversations = null !== (n = this.conversations) && void 0 !== n ? n : new u.conversations(this)), u.productTours && this.Ri.push(this.productTours = new u.productTours(this)), u.heatmaps && this.Ri.push(this.heatmaps = new u.heatmaps(this)), u.webVitalsAutocapture && this.Ri.push(this.webVitalsAutocapture = new u.webVitalsAutocapture(this)), u.exceptionObserver && this.Ri.push(this.exceptionObserver = new u.exceptionObserver(this)), u.deadClicksAutocapture && this.Ri.push(this.deadClicksAutocapture = new u.deadClicksAutocapture(this, yr)), u.toolbar && this.Ri.push(this.toolbar = null !== (o = this.toolbar) && void 0 !== o ? o : new u.toolbar(this)), u.experiments && this.Ri.push(this.experiments = null !== (a = this.experiments) && void 0 !== a ? a : new u.experiments(this)), this.Ri.forEach(((t) => {
				t.initialize && h.push((() => {
					null == t.initialize || t.initialize();
				}));
			})), h.push((() => {
				if (this.Yi) {
					var t = this.Yi;
					this.Yi = void 0, this.Nr(t);
				}
			})), this.Gi(h, l);
		}
		Gi(t, e) {
			for (; t.length > 0;) {
				if (this.config.__preview_deferred_init_extensions && performance.now() - e >= 30 && t.length > 0) return void setTimeout((() => {
					this.Gi(t, e);
				}), 0);
				var i = t.shift();
				if (i) try {
					i();
				} catch (t) {
					Ce.error("Error initializing extension:", t);
				}
			}
			var r = Math.round(performance.now() - e);
			this.register_for_session({
				[Ri]: this.config.__preview_deferred_init_extensions ? "deferred" : "synchronous",
				[Pi]: r
			}), this.config.__preview_deferred_init_extensions && Ce.info("PostHog extensions initialized (" + r + "ms)");
		}
		Nr(t) {
			var e;
			if (!r || !r.body) return Ce.info("document not ready yet, trying again in 500 milliseconds..."), void setTimeout((() => {
				this.Nr(t);
			}), 500);
			this.config.__preview_deferred_init_extensions && (this.Yi = t), this.Wi = t, this.compression = void 0, t.supportedCompression && !this.config.disable_compression && (this.compression = w(t.supportedCompression, fs.GZipJS) ? fs.GZipJS : w(t.supportedCompression, fs.Base64) ? fs.Base64 : void 0), null != (e = t.analytics) && e.endpoint && (this.analyticsDefaultEndpoint = t.analytics.endpoint), this.set_config({ person_profiles: this.Li ? this.Li : Di }), this.Ri.forEach(((e) => null == e.onRemoteConfig ? void 0 : e.onRemoteConfig(t)));
		}
		Ui() {
			try {
				this.config.loaded(this);
			} catch (t) {
				Ce.critical("`loaded` function failed", t);
			}
			if (this.Xi(), this.config.internal_or_test_user_hostname && null != s && s.hostname) {
				var t = s.hostname, e = this.config.internal_or_test_user_hostname;
				("string" == typeof e ? t === e : e.test(t)) && this.setInternalOrTestUser();
			}
			this.config.capture_pageview && setTimeout((() => {
				(this.consent.isOptedIn() || this.Ni()) && this.Ji();
			}), 1), this.Ki = new cs(this), this.Ki.load();
		}
		Xi() {
			var t;
			this.is_capturing() && this.config.request_batching && (null == (t = this.Zi) || t.enable());
		}
		_dom_loaded() {
			this.is_capturing() && Hi(this.__request_queue, ((t) => this.Hi(t))), this.__request_queue = [], this.Xi();
		}
		_handle_unload() {
			var t, e, i, r;
			null == (t = this.surveys) || t.handlePageUnload(), this.config.request_batching ? (this.Qi() && this.capture(ji), null == (e = this.logs) || e.flushLogs("sendBeacon"), null == (i = this.Zi) || i.unload(), null == (r = this.Vi) || r.unload()) : this.Qi() && this.capture(ji, null, { transport: "sendBeacon" });
		}
		_send_request(t) {
			this.__loaded && (Bn ? this.__request_queue.push(t) : this.rateLimiter.isServerRateLimited(t.batchKey) || (t.transport = t.transport || this.config.api_transport, t.url = Xs(t.url, { ip: this.config.ip ? 1 : 0 }), t.headers = f({}, this.config.request_headers, t.headers), t.compression = "best-available" === t.compression ? this.compression : t.compression, t.disableXHRCredentials = this.config.__preview_disable_xhr_credentials, this.config.__preview_disable_beacon && (t.disableTransport = ["sendBeacon"]), t.fetchOptions = t.fetchOptions || this.config.fetch_options, ((t) => {
				var e, i, r, s = f({}, t);
				s.timeout = s.timeout || 6e4, s.url = en(s.url, s.compression);
				var n = null !== (e = s.transport) && void 0 !== e ? e : "fetch", o = rn.filter(((t) => !s.disableTransport || !t.transport || !s.disableTransport.includes(t.transport))), a = null !== (i = null == (r = function(t, e) {
					for (var i = 0; t.length > i; i++) if (t[i].transport === n) return t[i];
				}(o)) ? void 0 : r.method) && void 0 !== i ? i : o[0].method;
				if (!a) throw new Error("No available transport method");
				"sendBeacon" !== n && s.data && s.compression === fs.GZipJS && l && !Ks ? tn(s).then(((t) => {
					a(t);
				})).catch(((e) => {
					if (((t) => !(!t || "object" != typeof t) && "NotReadableError" === ("name" in t ? String(t.name) : ""))(e)) return Ks = !0, void a(f({}, s, {
						compression: void 0,
						url: en(t.url, void 0)
					}));
					a(s);
				})) : a(s);
			})(f({}, t, { callback: (e) => {
				var i, r;
				this.rateLimiter.checkForLimiting(e), 400 > e.statusCode || null == (i = (r = this.config).on_request_error) || i.call(r, e), null == t.callback || t.callback(e);
			} }))));
		}
		Hi(t) {
			this.Vi ? this.Vi.retriableRequest(t) : this._send_request(t);
		}
		_execute_array(t) {
			Mn++;
			try {
				var e, i = [], r = [], s = [];
				Hi(t, ((t) => {
					t && (R(e = t[0]) ? s.push(t) : P(t) ? t.call(this) : R(t) && "alias" === e ? i.push(t) : R(t) && -1 !== e.indexOf("capture") && P(this[e]) ? s.push(t) : r.push(t));
				}));
				var n = function(t, e) {
					Hi(t, (function(t) {
						if (R(t[0])) {
							var i = e;
							qi(t, (function(t) {
								i = i[t[0]].apply(i, t.slice(1));
							}));
						} else e[t[0]].apply(e, t.slice(1));
					}));
				};
				n(i, this), n(r, this), n(s, this);
			} finally {
				Mn--;
			}
		}
		push(t) {
			if (Mn > 0 && R(t) && A(t[0])) {
				var e = Gn.prototype[t[0]];
				P(e) && e.apply(this, t.slice(1));
			} else this._execute_array([t]);
		}
		capture(t, e, i) {
			var r, s, n, o, a;
			if (this.__loaded && this.persistence && this.sessionPersistence && this.Zi) {
				if (this.is_capturing()) if (!C(t) && A(t)) {
					var l = !this.config.opt_out_useragent_filter && this._is_bot();
					if (!l || this.config.__preview_capture_bot_pageviews) {
						var u = null != i && i.skip_client_rate_limiting ? void 0 : this.rateLimiter.clientRateLimitContext();
						if (null == u || !u.isRateLimited) {
							null != e && e.$current_url && !A(null == e ? void 0 : e.$current_url) && (Ce.error("Invalid `$current_url` property provided to `posthog.capture`. Input must be a string. Ignoring provided value."), null == e || delete e.$current_url), "$exception" !== t || null != i && i.en || Ce.warn("Using `posthog.capture('$exception')` is unreliable because it does not attach required metadata. Use `posthog.captureException(error)` instead, which attaches required metadata automatically."), this.sessionPersistence.update_search_keyword(), this.config.save_campaign_params && this.sessionPersistence.update_campaign_params(), this.config.save_referrer && this.sessionPersistence.update_referrer_info(), (this.config.save_campaign_params || this.config.save_referrer) && this.persistence.set_initial_person_info();
							var h = /* @__PURE__ */ new Date(), d = (null == i ? void 0 : i.timestamp) || h, v = nr(), c = {
								uuid: v,
								event: t,
								properties: this.calculateEventProperties(t, e || {}, d, v)
							};
							t === Ni && this.config.__preview_capture_bot_pageviews && l && (c.event = "$bot_pageview", c.properties.$browser_type = "bot"), u && (c.properties.$lib_rate_limit_remaining_tokens = u.remainingTokens), null != i && i.$set && (c.$set = null == i ? void 0 : i.$set);
							var p, _, g, m = this.tn(null == i ? void 0 : i.$set_once, t !== Bi, t === zi);
							if (m && (c.$set_once = m), null != i && i._noTruncate || (s = this.config.properties_string_max_length, n = c, o = (t) => A(t) ? t.slice(0, s) : t, a = /* @__PURE__ */ new Set(), c = function t(e, i) {
								return e !== Object(e) ? o ? o(e) : e : a.has(e) ? void 0 : (a.add(e), R(e) ? (r = [], Hi(e, ((e) => {
									r.push(t(e));
								}))) : (r = {}, qi(e, ((e, i) => {
									a.has(e) || (r[i] = t(e, i));
								}))), r);
								var r;
							}(n)), c.timestamp = d, C(null == i ? void 0 : i.timestamp) || (c.properties.$event_time_override_provided = !0, c.properties.$event_time_override_system_time = h), t === ss.DISMISSED || t === ss.SENT) {
								var b = null == e ? void 0 : e[ns.SURVEY_ID], y = null == e ? void 0 : e[ns.SURVEY_ITERATION];
								((t) => {
									try {
										var e = ((t) => ((t, e) => {
											var i = "" + kn + e.id;
											return e.current_iteration && e.current_iteration > 0 && (i = "" + kn + e.id + "_" + e.current_iteration), i;
										})(0, t))(t);
										if (localStorage.getItem(e)) return;
										localStorage.setItem(e, "true");
									} catch (t) {
										Tn.error("Failed to persist survey seen state", t);
									}
								})({
									id: b,
									current_iteration: y
								}), c.$set = f({}, c.$set, { [(p = {
									id: b,
									current_iteration: y
								}, _ = t === ss.SENT ? "responded" : "dismissed", g = "$survey_" + _ + "/" + p.id, p.current_iteration && p.current_iteration > 0 && (g = "$survey_" + _ + "/" + p.id + "/" + p.current_iteration), g)]: !0 });
							} else t === ss.SHOWN && (c.$set = f({}, c.$set, { [ns.SURVEY_LAST_SEEN_DATE]: (/* @__PURE__ */ new Date()).toISOString() }));
							if (t === ls.SHOWN) {
								var w = null == e ? void 0 : e[us.TOUR_TYPE];
								w && (c.$set = f({}, c.$set, { [us.TOUR_LAST_SEEN_DATE + "/" + w]: (/* @__PURE__ */ new Date()).toISOString() }));
							}
							var x = f({}, c.properties.$set, c.$set);
							if (I(x) || this.setPersonPropertiesForFlags(x), !D(this.config.before_send)) {
								var E = this.rn(c);
								if (!E) return;
								c = E;
							}
							this.Fi.emit("eventCaptured", c);
							var S = {
								method: "POST",
								url: null !== (r = null == i ? void 0 : i._url) && void 0 !== r ? r : this.requestRouter.endpointFor("api", this.analyticsDefaultEndpoint),
								data: c,
								compression: "best-available",
								batchKey: null == i ? void 0 : i._batchKey
							};
							return !this.config.request_batching || i && (null == i || !i._batchKey) || null != i && i.send_instantly ? this.Hi(S) : this.Zi.enqueue(S), c;
						}
						Ce.critical("This capture call is ignored due to client rate limiting.");
					}
				} else Ce.error("No event name provided to posthog.capture");
			} else Ce.uninitializedWarning("posthog.capture");
		}
		_addCaptureHook(t) {
			return this.on("eventCaptured", ((e) => t(e.event, e)));
		}
		calculateEventProperties(e, i, n, o, a) {
			if (n = n || /* @__PURE__ */ new Date(), !this.persistence || !this.sessionPersistence) return i;
			var l = a ? void 0 : this.persistence.remove_event_timer(e), h = f({}, i);
			if (h.token = this.config.token, h.$config_defaults = this.config.defaults, this.Ni() && (h.$cookieless_mode = !0), "$snapshot" === e) {
				var d = f({}, this.persistence.properties(), this.sessionPersistence.properties());
				return h.distinct_id = d.distinct_id, (!A(h.distinct_id) && !L(h.distinct_id) || F(h.distinct_id)) && Ce.error("Invalid distinct_id for replay event. This indicates a bug in your implementation"), h;
			}
			var c, p = function(e, i) {
				var r, n, o, a;
				if (!u) return {};
				var l, h, d, c, p, f, _, g, m = e ? [...Fr, ...i || []] : [], [b, y] = function(t) {
					for (var e = 0; Gt.length > e; e++) {
						var [i, r] = Gt[e], s = i.exec(t), n = s && (P(r) ? r(s, t) : r);
						if (n) return n;
					}
					return ["", ""];
				}(u);
				return Vi(Ji({
					$os: b,
					$os_version: y,
					$browser: qt(u, navigator.vendor),
					$device: Yt(u),
					$device_type: (h = u, d = {
						userAgentDataPlatform: null == (r = navigator) || null == (r = r.userAgentData) ? void 0 : r.platform,
						maxTouchPoints: null == (n = navigator) ? void 0 : n.maxTouchPoints,
						screenWidth: null == t || null == (o = t.screen) ? void 0 : o.width,
						screenHeight: null == t || null == (a = t.screen) ? void 0 : a.height,
						devicePixelRatio: null == t ? void 0 : t.devicePixelRatio
					}, g = Yt(h), g === nt || g === st || "Kobo" === g || "Kindle Fire" === g || g === Mt ? rt : g === St || g === Tt || g === $t || g === Ct ? "Console" : g === at ? "Wearable" : g ? tt : "Android" === (null == d ? void 0 : d.userAgentDataPlatform) && (null !== (c = null == d ? void 0 : d.maxTouchPoints) && void 0 !== c ? c : 0) > 0 ? 600 > Math.min(null !== (p = null == d ? void 0 : d.screenWidth) && void 0 !== p ? p : 0, null !== (f = null == d ? void 0 : d.screenHeight) && void 0 !== f ? f : 0) / (null !== (_ = null == d ? void 0 : d.devicePixelRatio) && void 0 !== _ ? _ : 1) ? tt : rt : "Desktop"),
					$timezone: Wr(),
					$timezone_offset: Gr()
				}), {
					$current_url: Ir(null == s ? void 0 : s.href, m, Dr),
					$host: null == s ? void 0 : s.host,
					$pathname: null == s ? void 0 : s.pathname,
					$raw_user_agent: u.length > 1e3 ? u.substring(0, 997) + "..." : u,
					$browser_version: Wt(u, navigator.vendor),
					$browser_language: zr(),
					$browser_language_prefix: (l = zr(), "string" == typeof l ? l.split("-")[0] : void 0),
					$screen_height: null == t ? void 0 : t.screen.height,
					$screen_width: null == t ? void 0 : t.screen.width,
					$viewport_height: null == t ? void 0 : t.innerHeight,
					$viewport_width: null == t ? void 0 : t.innerWidth,
					$lib: v.LIB_NAME,
					$lib_version: v.LIB_VERSION,
					$insert_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10),
					$time: Date.now() / 1e3
				});
			}(this.config.mask_personal_data_properties, this.config.custom_personal_data_properties);
			if (this.sessionManager) {
				var { sessionId: _, windowId: g } = this.sessionManager.checkAndGetSessionAndWindowId(a, n.getTime());
				h.$session_id = _, h.$window_id = g;
			}
			this.sessionPropsManager && Vi(h, this.sessionPropsManager.getSessionProps());
			try {
				var m;
				this.sessionRecording && Vi(h, this.sessionRecording.sdkDebugProperties), h.$sdk_debug_retry_queue_size = null == (m = this.Vi) ? void 0 : m.length;
			} catch (t) {
				h.$sdk_debug_error_capturing_properties = String(t);
			}
			if (this.requestRouter.region === xn && (h.$lib_custom_api_host = this.config.api_host), c = e !== Ni || a ? e !== ji || a ? this.pageViewManager.doEvent() : this.pageViewManager.doPageLeave(n) : this.pageViewManager.doPageView(n, o), h = Vi(h, c), e === Ni && r && (h.title = r.title), !C(l)) {
				var b = n.getTime() - l;
				h.$duration = parseFloat((b / 1e3).toFixed(3));
			}
			u && this.config.opt_out_useragent_filter && (h.$browser_type = this._is_bot() ? "bot" : "browser"), (h = Vi({}, p, this.persistence.properties(), this.sessionPersistence.properties(), h)).$is_identified = this._isIdentified(), R(this.config.property_denylist) ? qi(this.config.property_denylist, (function(t) {
				delete h[t];
			})) : Ce.error(jn + this.config.property_denylist + " or property_blacklist config: " + this.config.property_blacklist);
			var y = this.config.sanitize_properties;
			y && (Ce.error(Nn), h = y(h, e));
			var w = this.nn();
			return h.$process_person_profile = w, w && !a && this.sn("_calculate_event_properties"), h;
		}
		tn(t, e, i) {
			var r;
			if (void 0 === e && (e = !0), void 0 === i && (i = !1), !this.persistence || !this.nn()) return t;
			if (this.Mi && !i) return t;
			var o = Vi({}, this.persistence.get_initial_props(), (null == (r = this.sessionPropsManager) ? void 0 : r.getSetOnceProps()) || {}, t || {}), a = this.config.sanitize_properties;
			return a && (Ce.error(Nn), o = a(o, "$set_once")), e && (this.Mi = !0), I(o) ? void 0 : o;
		}
		register(t, e) {
			var i;
			null == (i = this.persistence) || i.register(t, e);
		}
		register_once(t, e, i) {
			var r;
			null == (r = this.persistence) || r.register_once(t, e, i);
		}
		register_for_session(t) {
			var e;
			null == (e = this.sessionPersistence) || e.register(t);
		}
		unregister(t) {
			var e;
			null == (e = this.persistence) || e.unregister(t);
		}
		unregister_for_session(t) {
			var e;
			null == (e = this.sessionPersistence) || e.unregister(t);
		}
		an(t, e) {
			this.register({ [t]: e });
		}
		getFeatureFlag(t, e) {
			var i;
			return null == (i = this.featureFlags) ? void 0 : i.getFeatureFlag(t, e);
		}
		getFeatureFlagPayload(t) {
			var e;
			return null == (e = this.featureFlags) ? void 0 : e.getFeatureFlagPayload(t);
		}
		getFeatureFlagResult(t, e) {
			var i;
			return null == (i = this.featureFlags) ? void 0 : i.getFeatureFlagResult(t, e);
		}
		isFeatureEnabled(t, e) {
			var i;
			return null == (i = this.featureFlags) ? void 0 : i.isFeatureEnabled(t, e);
		}
		reloadFeatureFlags() {
			var t;
			null == (t = this.featureFlags) || t.reloadFeatureFlags();
		}
		updateFlags(t, e, i) {
			var r;
			null == (r = this.featureFlags) || r.updateFlags(t, e, i);
		}
		updateEarlyAccessFeatureEnrollment(t, e, i) {
			var r;
			null == (r = this.featureFlags) || r.updateEarlyAccessFeatureEnrollment(t, e, i);
		}
		getEarlyAccessFeatures(t, e, i) {
			var r;
			return void 0 === e && (e = !1), null == (r = this.featureFlags) ? void 0 : r.getEarlyAccessFeatures(t, e, i);
		}
		on(t, e) {
			return this.Fi.on(t, e);
		}
		onFeatureFlags(t) {
			return this.featureFlags ? this.featureFlags.onFeatureFlags(t) : (t([], {}, { errorsLoading: !0 }), () => {});
		}
		onSurveysLoaded(t) {
			return this.surveys ? this.surveys.onSurveysLoaded(t) : (t([], {
				isLoaded: !1,
				error: Un
			}), () => {});
		}
		onSessionId(t) {
			var e, i;
			return null !== (e = null == (i = this.sessionManager) ? void 0 : i.onSessionId(t)) && void 0 !== e ? e : () => {};
		}
		getSurveys(t, e) {
			void 0 === e && (e = !1), this.surveys ? this.surveys.getSurveys(t, e) : t([], {
				isLoaded: !1,
				error: Un
			});
		}
		getActiveMatchingSurveys(t, e) {
			void 0 === e && (e = !1), this.surveys ? this.surveys.getActiveMatchingSurveys(t, e) : t([], {
				isLoaded: !1,
				error: Un
			});
		}
		renderSurvey(t, e) {
			var i;
			null == (i = this.surveys) || i.renderSurvey(t, e);
		}
		displaySurvey(t, e) {
			var i;
			void 0 === e && (e = Pn), null == (i = this.surveys) || i.displaySurvey(t, e);
		}
		cancelPendingSurvey(t) {
			var e;
			null == (e = this.surveys) || e.cancelPendingSurvey(t);
		}
		canRenderSurvey(t) {
			var e, i;
			return null !== (e = null == (i = this.surveys) ? void 0 : i.canRenderSurvey(t)) && void 0 !== e ? e : {
				visible: !1,
				disabledReason: Un
			};
		}
		canRenderSurveyAsync(t, e) {
			var i, r;
			return void 0 === e && (e = !1), null !== (i = null == (r = this.surveys) ? void 0 : r.canRenderSurveyAsync(t, e)) && void 0 !== i ? i : Promise.resolve({
				visible: !1,
				disabledReason: Un
			});
		}
		ln(t) {
			return !t || F(t) ? (Ce.critical("Unique user id has not been set in posthog.identify"), !1) : t === ki ? (Ce.critical("The string \"" + t + "\" was set in posthog.identify which indicates an error. This ID is only used as a sentinel value."), !1) : !["distinct_id", "distinctid"].includes(t.toLowerCase()) && !["undefined", "null"].includes(t.toLowerCase()) || (Ce.critical("The string \"" + t + "\" was set in posthog.identify which indicates an error. This ID should be unique to the user and not a hardcoded string."), !1);
		}
		identify(t, e, i) {
			if (!this.__loaded || !this.persistence) return Ce.uninitializedWarning("posthog.identify");
			if (L(t) && (t = t.toString(), Ce.warn("The first argument to posthog.identify was a number, but it should be a string. It has been converted to a string.")), this.ln(t) && this.sn("posthog.identify")) {
				var r = this.get_distinct_id();
				this.register({ $user_id: t }), this.get_property(Le) || this.register_once({
					$had_persisted_distinct_id: !0,
					$device_id: r
				}, ""), t !== r && t !== this.get_property(Ue) && (this.unregister(Ue), this.register({ distinct_id: t }));
				var s, n = (this.persistence.get_property(bi) || Fi) === Fi;
				t !== r && n ? (this.persistence.set_property(bi, Mi), this.setPersonPropertiesForFlags({
					$set: e || {},
					$set_once: i || {}
				}, !1), this.capture(zi, {
					distinct_id: t,
					$anon_distinct_id: r
				}, {
					$set: e || {},
					$set_once: i || {}
				}), this.Di = _n(t, e, i), null == (s = this.featureFlags) || s.setAnonymousDistinctId(r)) : (e || i) && this.setPersonProperties(e, i), t !== r && (this.reloadFeatureFlags(), this.unregister(fi));
			}
		}
		setPersonProperties(t, e) {
			if ((t || e) && this.sn("posthog.setPersonProperties")) {
				var i = _n(this.get_distinct_id(), t, e);
				this.Di !== i ? (this.setPersonPropertiesForFlags({
					$set: t || {},
					$set_once: e || {}
				}, !0), this.capture("$set", {
					$set: t || {},
					$set_once: e || {}
				}), this.Di = i) : Ce.info("A duplicate setPersonProperties call was made with the same properties. It has been ignored.");
			}
		}
		group(t, e, i) {
			if (t && e) {
				var r = this.getGroups(), s = r[t] !== e;
				if (s && this.resetGroupPropertiesForFlags(t), this.register({ $groups: f({}, r, { [t]: e }) }), s || i) {
					var n = {
						$group_type: t,
						$group_key: e
					};
					i && (n.$group_set = i), this.capture(Bi, n);
				}
				i && this.setGroupPropertiesForFlags({ [t]: i }), s && !i && this.reloadFeatureFlags();
			} else Ce.error("posthog.group requires a group type and group key");
		}
		resetGroups() {
			this.register({ $groups: {} }), this.resetGroupPropertiesForFlags(), this.reloadFeatureFlags();
		}
		setPersonPropertiesForFlags(t, e) {
			var i;
			void 0 === e && (e = !0), null == (i = this.featureFlags) || i.setPersonPropertiesForFlags(t, e);
		}
		resetPersonPropertiesForFlags() {
			var t;
			null == (t = this.featureFlags) || t.resetPersonPropertiesForFlags();
		}
		setGroupPropertiesForFlags(t, e) {
			var i;
			void 0 === e && (e = !0), this.sn("posthog.setGroupPropertiesForFlags") && (null == (i = this.featureFlags) || i.setGroupPropertiesForFlags(t, e));
		}
		resetGroupPropertiesForFlags(t) {
			var e;
			null == (e = this.featureFlags) || e.resetGroupPropertiesForFlags(t);
		}
		reset(t) {
			var e, i, r, s, n, o, a, l;
			if (Ce.info("reset"), !this.__loaded) return Ce.uninitializedWarning("posthog.reset");
			var u = this.get_property(Le);
			if (this.consent.reset(), null == (e = this.persistence) || e.clear(), null == (i = this.sessionPersistence) || i.clear(), null == (r = this.surveys) || r.reset(), null == (s = this.Ki) || s.stop(), null == (n = this.featureFlags) || n.reset(), null == (o = this.conversations) || o.reset(), null == (a = this.persistence) || a.set_property(bi, Fi), null == (l = this.sessionManager) || l.resetSessionId(), this.Di = null, this.config.cookieless_mode === Ai) this.register_once({
				distinct_id: ki,
				$device_id: null
			}, "");
			else {
				var h = this.config.get_device_id(nr());
				this.register_once({
					distinct_id: h,
					$device_id: t ? h : u
				}, "");
			}
			this.register({ $last_posthog_reset: (/* @__PURE__ */ new Date()).toISOString() }, 1), delete this.config.identity_distinct_id, delete this.config.identity_hash, this.reloadFeatureFlags();
		}
		setIdentity(t, e) {
			var i;
			this.config.identity_distinct_id = t, this.config.identity_hash = e, this.alias(t), null == (i = this.conversations) || i.un();
		}
		clearIdentity() {
			var t;
			delete this.config.identity_distinct_id, delete this.config.identity_hash, null == (t = this.conversations) || t.hn();
		}
		get_distinct_id() {
			return this.get_property("distinct_id");
		}
		getGroups() {
			return this.get_property("$groups") || {};
		}
		get_session_id() {
			var t, e;
			return null !== (t = null == (e = this.sessionManager) ? void 0 : e.checkAndGetSessionAndWindowId(!0).sessionId) && void 0 !== t ? t : "";
		}
		get_session_replay_url(t) {
			if (!this.sessionManager) return "";
			var { sessionId: e, sessionStartTimestamp: i } = this.sessionManager.checkAndGetSessionAndWindowId(!0), r = this.requestRouter.endpointFor("ui", "/project/" + this.config.token + "/replay/" + e);
			if (null != t && t.withTimestamp && i) {
				var s, n = null !== (s = t.timestampLookBack) && void 0 !== s ? s : 10;
				if (!i) return r;
				r += "?t=" + Math.max(Math.floor(((/* @__PURE__ */ new Date()).getTime() - i) / 1e3) - n, 0);
			}
			return r;
		}
		alias(t, e) {
			return t === this.get_property(De) ? (Ce.critical("Attempting to create alias for existing People user - aborting."), -2) : this.sn("posthog.alias") ? (C(e) && (e = this.get_distinct_id()), t !== e ? (this.an(Ue, t), this.capture("$create_alias", {
				alias: t,
				distinct_id: e
			})) : (Ce.warn("alias matches current distinct_id - skipping api call."), this.identify(t), -1)) : void 0;
		}
		set_config(t) {
			var e = f({}, this.config);
			if (O(t)) {
				var i, r, s, n, o, a, l, u, h, d;
				Vi(this.config, Vn(t));
				var c = this.qi();
				null == (i = this.persistence) || i.update_config(this.config, e, c), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new Jr(f({}, this.config, { persistence: "sessionStorage" }), c);
				var p = this.Bi(this.config.debug);
				N(p) && (this.config.debug = p), N(this.config.debug) && (this.config.debug ? (v.DEBUG = !0, dr.R() && dr.M("ph_debug", !0), Ce.info("set_config", {
					config: t,
					oldConfig: e,
					newConfig: f({}, this.config)
				})) : (v.DEBUG = !1, dr.R() && dr.F("ph_debug"))), null == (r = this.exceptionObserver) || r.onConfigChange(), null == (s = this.exceptions) || s.onConfigChange(), null == (n = this.sessionRecording) || n.startIfEnabledOrStop(), null == (o = this.autocapture) || o.startIfEnabled(), null == (a = this.heatmaps) || a.startIfEnabled(), null == (l = this.exceptionObserver) || l.startIfEnabledOrStop(), null == (u = this.deadClicksAutocapture) || u.startIfEnabledOrStop(), null == (h = this.surveys) || h.loadIfEnabled(), this.cn(), null == (d = this.externalIntegrations) || d.startIfEnabledOrStop();
			}
		}
		_overrideSDKInfo(t, e) {
			v.LIB_NAME = t, v.LIB_VERSION = e;
		}
		startSessionRecording(t) {
			var e, i, r, s, n, o = !0 === t, a = {
				sampling: o || !(null == t || !t.sampling),
				linked_flag: o || !(null == t || !t.linked_flag),
				url_trigger: o || !(null == t || !t.url_trigger),
				event_trigger: o || !(null == t || !t.event_trigger)
			};
			Object.values(a).some(Boolean) && (null == (e = this.sessionManager) || e.checkAndGetSessionAndWindowId(), a.sampling && (null == (i = this.sessionRecording) || i.overrideSampling()), a.linked_flag && (null == (r = this.sessionRecording) || r.overrideLinkedFlag()), a.url_trigger && (null == (s = this.sessionRecording) || s.overrideTrigger("url")), a.event_trigger && (null == (n = this.sessionRecording) || n.overrideTrigger("event")));
			this.set_config({ disable_session_recording: !1 });
		}
		stopSessionRecording() {
			this.set_config({ disable_session_recording: !0 });
		}
		sessionRecordingStarted() {
			var t;
			return !(null == (t = this.sessionRecording) || !t.started);
		}
		captureException(t, e) {
			if (this.exceptions) {
				var i = /* @__PURE__ */ new Error("PostHog syntheticException"), r = this.exceptions.buildProperties(t, {
					handled: !0,
					syntheticException: i
				});
				return this.exceptions.sendExceptionEvent(f({}, r, e));
			}
		}
		addExceptionStep(t, e) {
			var i;
			null == (i = this.exceptions) || i.addExceptionStep(t, e);
		}
		captureLog(t) {
			var e;
			null == (e = this.logs) || e.captureLog(t);
		}
		get logger() {
			var t, e;
			return null !== (t = null == (e = this.logs) ? void 0 : e.logger) && void 0 !== t ? t : Gn.dn;
		}
		startExceptionAutocapture(t) {
			this.set_config({ capture_exceptions: null == t || t });
		}
		stopExceptionAutocapture() {
			this.set_config({ capture_exceptions: !1 });
		}
		loadToolbar(t) {
			var e, i;
			return null !== (e = null == (i = this.toolbar) ? void 0 : i.loadToolbar(t)) && void 0 !== e && e;
		}
		get_property(t) {
			var e;
			return null == (e = this.persistence) ? void 0 : e.props[t];
		}
		getSessionProperty(t) {
			var e;
			return null == (e = this.sessionPersistence) ? void 0 : e.props[t];
		}
		toString() {
			var t, e = null !== (t = this.config.name) && void 0 !== t ? t : zn;
			return e !== zn && (e = zn + "." + e), e;
		}
		_isIdentified() {
			var t, e;
			return (null == (t = this.persistence) ? void 0 : t.get_property(bi)) === Mi || (null == (e = this.sessionPersistence) ? void 0 : e.get_property(bi)) === Mi;
		}
		nn() {
			var t, e;
			return !("never" === this.config.person_profiles || this.config.person_profiles === Di && !this._isIdentified() && I(this.getGroups()) && (null == (t = this.persistence) || null == (t = t.props) || !t[Ue]) && (null == (e = this.persistence) || null == (e = e.props) || !e[$i]));
		}
		Qi() {
			return !0 === this.config.capture_pageleave || "if_capture_pageview" === this.config.capture_pageleave && (!0 === this.config.capture_pageview || "history_change" === this.config.capture_pageview);
		}
		createPersonProfile() {
			this.nn() || this.sn("posthog.createPersonProfile") && this.setPersonProperties({}, {});
		}
		setInternalOrTestUser() {
			this.sn("posthog.setInternalOrTestUser") && this.setPersonProperties({ $internal_or_test_user: !0 });
		}
		sn(t) {
			return "never" === this.config.person_profiles ? (Ce.error(t + " was called, but process_person is set to \"never\". This call will be ignored."), !1) : (this.an($i, !0), !0);
		}
		qi() {
			if ("always" === this.config.cookieless_mode) return !0;
			var t = this.consent.isOptedOut();
			return this.config.disable_persistence || t && !(!this.config.opt_out_persistence_by_default && this.config.cookieless_mode !== Ci);
		}
		cn() {
			var t, e, i, r, s = this.qi();
			return (null == (t = this.persistence) ? void 0 : t.wr) !== s && (null == (i = this.persistence) || i.set_disabled(s)), (null == (e = this.sessionPersistence) ? void 0 : e.wr) !== s && (null == (r = this.sessionPersistence) || r.set_disabled(s)), s;
		}
		opt_in_capturing(t) {
			var e;
			if (this.config.cookieless_mode !== Ai) {
				if (this.Ni()) {
					var i, r, s, n, o;
					this.reset(!0), null == (i = this.sessionManager) || i.destroy(), null == (r = this.pageViewManager) || r.destroy(), this.sessionManager = new cn(this), this.pageViewManager = new Tr(this), this.persistence && (this.sessionPropsManager = new hn(this, this.sessionManager, this.persistence));
					var a, l = null !== (s = null == (n = this.config.__extensionClasses) ? void 0 : n.sessionRecording) && void 0 !== s ? s : null == (o = Gn.__defaultExtensionClasses) ? void 0 : o.sessionRecording;
					l && (this.sessionRecording = this.Ei(this.sessionRecording, new l(this)), this.Wi && (null == (a = this.sessionRecording) || null == a.onRemoteConfig || a.onRemoteConfig(this.Wi)));
				}
				var u, h;
				this.consent.optInOut(!0), this.cn(), this.Xi(), null == (e = this.sessionRecording) || e.startIfEnabledOrStop(), this.config.cookieless_mode == Ci && (null == (u = this.surveys) || u.loadIfEnabled()), (C(null == t ? void 0 : t.captureEventName) || null != t && t.captureEventName) && this.capture(null !== (h = null == t ? void 0 : t.captureEventName) && void 0 !== h ? h : "$opt_in", null == t ? void 0 : t.captureProperties, { send_instantly: !0 }), this.config.capture_pageview && this.Ji();
			} else Ce.warn(Ln);
		}
		opt_out_capturing() {
			var t, e, i;
			this.config.cookieless_mode !== Ai ? (this.config.cookieless_mode === Ci && this.consent.isOptedIn() && this.reset(!0), this.consent.optInOut(!1), this.cn(), this.config.cookieless_mode === Ci && (this.register({
				distinct_id: ki,
				$device_id: null
			}), null == (t = this.sessionManager) || t.destroy(), null == (e = this.pageViewManager) || e.destroy(), this.sessionManager = void 0, this.sessionPropsManager = void 0, null == (i = this.sessionRecording) || i.stopRecording(), this.sessionRecording = void 0, this.Ji())) : Ce.warn(Ln);
		}
		has_opted_in_capturing() {
			return this.consent.isOptedIn();
		}
		has_opted_out_capturing() {
			return this.consent.isOptedOut();
		}
		get_explicit_consent_status() {
			var t = this.consent.consent;
			return 1 === t ? "granted" : 0 === t ? "denied" : "pending";
		}
		is_capturing() {
			return this.config.cookieless_mode === Ai || (this.config.cookieless_mode === Ci ? this.consent.isRejected() || this.consent.isOptedIn() : !this.has_opted_out_capturing());
		}
		clear_opt_in_out_capturing() {
			this.consent.reset(), this.cn();
		}
		_is_bot() {
			return i ? pn(i, this.config.custom_blocked_useragents) : void 0;
		}
		Ji() {
			r && ("visible" === r.visibilityState ? this.Oi || (this.Oi = !0, this.capture(Ni, { title: r.title }, { send_instantly: !0 }), this.Pi && (r.removeEventListener(Li, this.Pi), this.Pi = null)) : this.Pi || (this.Pi = this.Ji.bind(this), Qi(r, Li, this.Pi)));
		}
		debug(e) {
			!1 === e ? (t?.console.log("You've disabled debug mode."), this.set_config({ debug: !1 })) : (t?.console.log("You're now in debug mode. All calls to PostHog will be logged in your console.\nYou can disable this with `posthog.debug(false)`."), this.set_config({ debug: !0 }));
		}
		Fr() {
			var t, e, i, r, s, n, o = this.ji || {};
			return "advanced_disable_flags" in o ? !!o.advanced_disable_flags : !1 !== this.config.advanced_disable_flags ? !!this.config.advanced_disable_flags : !0 === this.config.advanced_disable_decide ? (Ce.warn("Config field 'advanced_disable_decide' is deprecated. Please use 'advanced_disable_flags' instead. The old field will be removed in a future major version."), !0) : (i = "advanced_disable_decide", r = Ce, s = (e = "advanced_disable_flags") in (t = o) && !D(t[e]), n = i in t && !D(t[i]), s ? t[e] : !!n && (r && r.warn("Config field '" + i + "' is deprecated. Please use '" + e + "' instead. The old field will be removed in a future major version."), t[i]));
		}
		rn(t) {
			if (D(this.config.before_send)) return t;
			var e = R(this.config.before_send) ? this.config.before_send : [this.config.before_send], i = t;
			for (var r of e) {
				if (i = r(i), D(i)) {
					var s = "Event '" + t.event + "' was rejected in beforeSend function";
					return z(t.event) ? Ce.warn(s + ". This can cause unexpected behavior.") : Ce.info(s), null;
				}
				i.properties && !I(i.properties) || Ce.warn("Event '" + t.event + "' has no properties after beforeSend function, this is likely an error.");
			}
			return i;
		}
		getPageViewId() {
			var t;
			return null == (t = this.pageViewManager.dr) ? void 0 : t.pageViewId;
		}
		captureTraceFeedback(t, e) {
			this.capture("$ai_feedback", {
				$ai_trace_id: String(t),
				$ai_feedback_text: e
			});
		}
		captureTraceMetric(t, e, i) {
			this.capture("$ai_metric", {
				$ai_trace_id: String(t),
				$ai_metric_name: e,
				$ai_metric_value: String(i)
			});
		}
		Bi(t) {
			var e = N(t) && !t, i = dr.R() && "true" === dr.O("ph_debug");
			return !e && (!!i || t);
		}
	};
	Gn.__defaultExtensionClasses = {}, Gn.dn = {
		trace: An = () => {},
		debug: An,
		info: An,
		warn: An,
		error: An,
		fatal: An
	}, function(t, e) {
		for (var i = 0; e.length > i; i++) t.prototype[e[i]] = Yi(t.prototype[e[i]]);
	}(Gn, ["identify"]);
	var Yn = 1, Jn = 3, Kn = 11;
	function Xn(t) {
		return t instanceof Element && (t.id === Ti || !(null == t.closest || !t.closest(".toolbar-global-fade-container")));
	}
	function Qn(t) {
		return !!t && t.nodeType === Yn;
	}
	function Zn(t, e) {
		return !!t && !!t.tagName && t.tagName.toLowerCase() === e.toLowerCase();
	}
	function to(t) {
		return !!t && t.nodeType === Jn;
	}
	function eo(t) {
		return !!t && t.nodeType === Kn && Qn(t.host);
	}
	function io(t) {
		return t ? x(t).split(/\s+/) : [];
	}
	function ro(e) {
		var i = null == t ? void 0 : t.location.href;
		return !!(i && e && e.some(((t) => i.match(t))));
	}
	function so(t) {
		var e = "";
		switch (typeof t.className) {
			case "string":
				e = t.className;
				break;
			case "object":
				e = (t.className && "baseVal" in t.className ? t.className.baseVal : null) || t.getAttribute("class") || "";
				break;
			default: e = "";
		}
		return io(e);
	}
	function no(t) {
		return D(t) ? null : x(t).split(/(\s+)/).filter(((t) => So(t))).join("").replace(/[\r\n]/g, " ").replace(/[ ]+/g, " ").substring(0, 255);
	}
	function oo(t) {
		var e = "";
		return _o(t) && !go(t) && t.childNodes && t.childNodes.length && qi(t.childNodes, (function(t) {
			var i;
			to(t) && t.textContent && (e += null !== (i = no(t.textContent)) && void 0 !== i ? i : "");
		})), x(e);
	}
	function ao(t) {
		return C(t.target) ? t.srcElement || null : null != (e = t.target) && e.shadowRoot ? t.composedPath()[0] || null : t.target || null;
		var e;
	}
	var lo = [
		"a",
		"button",
		"form",
		"input",
		"select",
		"textarea",
		"label"
	];
	function uo(t, e) {
		if (C(e)) return !0;
		var i, r = function(t) {
			if (e.some(((e) => t.matches(e)))) return { v: !0 };
		};
		for (var s of t) if (i = r(s)) return i.v;
		return !1;
	}
	function ho(t) {
		var e = t.parentNode;
		return !(!e || !Qn(e)) && e;
	}
	var vo = [
		"next",
		"previous",
		"prev",
		">",
		"<"
	], co = [".ph-no-rageclick", ".ph-no-capture"];
	var po = (t) => !t || Zn(t, "html") || !Qn(t), fo = (e, i) => {
		if (!t || po(e)) return {
			parentIsUsefulElement: !1,
			targetElementList: []
		};
		for (var r = !1, s = [e], n = e; n.parentNode && !Zn(n, "body");) if (eo(n.parentNode)) s.push(n.parentNode.host), n = n.parentNode.host;
		else {
			var o = ho(n);
			if (!o) break;
			if (i || lo.indexOf(o.tagName.toLowerCase()) > -1) r = !0;
			else {
				var a = t.getComputedStyle(o);
				a && "pointer" === a.getPropertyValue("cursor") && (r = !0);
			}
			s.push(o), n = o;
		}
		return {
			parentIsUsefulElement: r,
			targetElementList: s
		};
	};
	function _o(t) {
		for (var e = t; e.parentNode && !Zn(e, "body"); e = e.parentNode) {
			var i = so(e);
			if (w(i, "ph-sensitive") || w(i, "ph-no-capture")) return !1;
		}
		if (w(so(t), "ph-include")) return !0;
		var r = t.type || "";
		if (A(r)) switch (r.toLowerCase()) {
			case "hidden":
			case "password": return !1;
		}
		var s = t.name || t.id || "";
		return !A(s) || !/^cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i.test(s.replace(/[^a-zA-Z0-9]/g, ""));
	}
	function go(t) {
		return !!(Zn(t, "input") && ![
			"button",
			"checkbox",
			"submit",
			"reset"
		].includes(t.type) || Zn(t, "select") || Zn(t, "textarea") || "true" === t.getAttribute("contenteditable"));
	}
	var mo = "(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11})", bo = new RegExp("^(?:" + mo + ")$"), yo = new RegExp(mo), wo = "\\d{3}-?\\d{2}-?\\d{4}", xo = new RegExp("^(" + wo + ")$"), Eo = new RegExp("(" + wo + ")");
	function So(t, e) {
		if (void 0 === e && (e = !0), D(t)) return !1;
		if (A(t)) {
			if (t = x(t), (e ? bo : yo).test((t || "").replace(/[- ]/g, ""))) return !1;
			if ((e ? xo : Eo).test(t)) return !1;
		}
		return !0;
	}
	function $o(t) {
		var e = oo(t);
		return So(e = (e + " " + To(t)).trim()) ? e : "";
	}
	function To(t) {
		var e = "";
		return t && t.childNodes && t.childNodes.length && qi(t.childNodes, (function(t) {
			var i;
			if (t && "span" === (null == (i = t.tagName) ? void 0 : i.toLowerCase())) try {
				var r = oo(t);
				e = (e + " " + r).trim(), t.childNodes && t.childNodes.length && (e = (e + " " + To(t)).trim());
			} catch (t) {
				Ce.error("[AutoCapture]", t);
			}
		})), e;
	}
	function ko(t) {
		return t.replace(/"|\\"/g, "\\\"");
	}
	function Ro(t) {
		var e = t.attr__class;
		return e ? R(e) ? e : io(e) : void 0;
	}
	var Po = class {
		constructor(t) {
			this.disabled = !1 === t;
			var e = O(t) ? t : {};
			this.thresholdPx = e.threshold_px || 30, this.timeoutMs = e.timeout_ms || 1e3, this.clickCount = e.click_count || 3, this.clicks = [];
		}
		isRageClick(t, e, i) {
			if (this.disabled) return !1;
			var r = this.clicks[this.clicks.length - 1];
			if (r && Math.abs(t - r.x) + Math.abs(e - r.y) < this.thresholdPx && this.timeoutMs > i - r.timestamp) {
				if (this.clicks.push({
					x: t,
					y: e,
					timestamp: i
				}), this.clicks.length === this.clickCount) return !0;
			} else this.clicks = [{
				x: t,
				y: e,
				timestamp: i
			}];
			return !1;
		}
	};
	var Oo = "$copy_autocapture", Io = Ae("[AutoCapture]");
	function Co(t, e) {
		return e.length > t ? e.slice(0, t) + "..." : e;
	}
	function Ao(t) {
		if (t.previousElementSibling) return t.previousElementSibling;
		var e = t;
		do
			e = e.previousSibling;
		while (e && !Qn(e));
		return e;
	}
	function Fo(e, i) {
		var r, s, { e: n, maskAllElementAttributes: o, maskAllText: a, elementAttributeIgnoreList: l, elementsChainAsString: u } = i;
		if (!Qn(e)) return { props: {} };
		for (var h = [e], d = e; d.parentNode && !Zn(d, "body");) if (eo(d.parentNode)) h.push(d.parentNode.host), d = d.parentNode.host;
		else {
			if (!Qn(d.parentNode)) break;
			h.push(d.parentNode), d = d.parentNode;
		}
		var v, c, p = [], _ = {}, g = !1, m = !1;
		if (qi(h, ((t) => {
			var e = _o(t);
			if (Zn(t, "a")) {
				var i = t.getAttribute("href");
				g = e && !!i && So(i) && i;
			}
			w(so(t), "ph-no-capture") && (m = !0), p.push(function(t, e, i, r) {
				var s = t.tagName.toLowerCase(), n = { tag_name: s };
				lo.indexOf(s) > -1 && !i && (n.$el_text = "a" === s.toLowerCase() || "button" === s.toLowerCase() ? Co(1024, $o(t)) : Co(1024, oo(t)));
				var o = so(t);
				o.length > 0 && (n.classes = o.filter((function(t) {
					return "" !== t;
				}))), qi(t.attributes, (function(i) {
					var s;
					if ((!go(t) || -1 !== [
						"name",
						"id",
						"class",
						"aria-label"
					].indexOf(i.name)) && (null == r || !r.includes(i.name)) && !e && So(i.value) && (!A(s = i.name) || "_ngcontent" !== s.substring(0, 10) && "_nghost" !== s.substring(0, 7))) {
						var o = i.value;
						"class" === i.name && (o = io(o).join(" ")), n["attr__" + i.name] = Co(1024, o);
					}
				}));
				for (var a = 1, l = 1, u = t; u = Ao(u);) a++, u.tagName === t.tagName && l++;
				return n.nth_child = a, n.nth_of_type = l, n;
			}(t, o, a, l));
			Vi(_, function(t) {
				if (!_o(t)) return {};
				var e = {};
				return qi(t.attributes, (function(t) {
					if (t.name && 0 === t.name.indexOf("data-ph-capture-attribute")) {
						var i = t.name.replace("data-ph-capture-attribute-", ""), r = t.value;
						i && r && So(r) && (e[i] = r);
					}
				})), e;
			}(t));
		})), m) return {
			props: {},
			explicitNoCapture: m
		};
		if (a || (p[0].$el_text = Zn(e, "a") || Zn(e, "button") ? $o(e) : oo(e)), g) {
			var b, y;
			p[0].attr__href = g;
			var x = null == (b = Pr(g)) ? void 0 : b.host, E = null == t || null == (y = t.location) ? void 0 : y.host;
			x && E && x !== E && (v = g);
		}
		return { props: Vi({
			$event_type: n.type,
			$ce_version: 1
		}, u ? {} : { $elements: p }, { $elements_chain: (c = p, function(t) {
			return t.map(((t) => {
				var e, i, r = "";
				if (t.tag_name && (r += t.tag_name), t.attr_class) for (var s of (t.attr_class.sort(), t.attr_class)) r += "." + s.replace(/"/g, "");
				var n = f({}, t.text ? { text: t.text } : {}, {
					"nth-child": null !== (e = t.nth_child) && void 0 !== e ? e : 0,
					"nth-of-type": null !== (i = t.nth_of_type) && void 0 !== i ? i : 0
				}, t.href ? { href: t.href } : {}, t.attr_id ? { attr_id: t.attr_id } : {}, t.attributes), o = {};
				return Wi(n).sort(((t, e) => {
					var [i] = t, [r] = e;
					return i.localeCompare(r);
				})).forEach(((t) => {
					var [e, i] = t;
					return o[ko(e.toString())] = ko(i.toString());
				})), (r += ":") + Wi(o).map(((t) => {
					var [e, i] = t;
					return e + "=\"" + i + "\"";
				})).join("");
			})).join(";");
		}(function(t) {
			return t.map(((t) => {
				var e, i, r = {
					text: null == (e = t.$el_text) ? void 0 : e.slice(0, 400),
					tag_name: t.tag_name,
					href: null == (i = t.attr__href) ? void 0 : i.slice(0, 2048),
					attr_class: Ro(t),
					attr_id: t.attr__id,
					nth_child: t.nth_child,
					nth_of_type: t.nth_of_type,
					attributes: {}
				};
				return Wi(t).filter(((t) => {
					var [e] = t;
					return 0 === e.indexOf("attr__");
				})).forEach(((t) => {
					var [e, i] = t;
					return r.attributes[e] = i;
				})), r;
			}));
		}(c))) }, null != (r = p[0]) && r.$el_text ? { $el_text: null == (s = p[0]) ? void 0 : s.$el_text } : {}, v && "click" === n.type ? { $external_click_url: v } : {}, _) };
	}
	var Mo = Ae("[ExceptionAutocapture]");
	function Do(t, e, i) {
		try {
			if (!(e in t)) return () => {};
			var r = t[e], s = i(r);
			return P(s) && (s.prototype = s.prototype || {}, Object.defineProperties(s, { __posthog_wrapped__: {
				enumerable: !1,
				value: !0
			} })), t[e] = s, () => {
				t[e] = r;
			};
		} catch (t) {
			return () => {};
		}
	}
	var Lo = Ae("[TracingHeaders]"), Uo = Ae("[Web Vitals]"), No = 9e5, jo = "disabled", zo = "lazy_loading", Bo = "awaiting_config", Ho = "missing_config";
	Ae("[SessionRecording]"), Ae("[SessionRecording]");
	var qo = "[SessionRecording]", Vo = Ae(qo), Wo = Ae("[Heatmaps]");
	function Go(t) {
		return O(t) && "clientX" in t && "clientY" in t && L(t.clientX) && L(t.clientY);
	}
	var Yo = Ae("[Product Tours]"), Jo = ["$set_once", "$set"], Ko = Ae("[SiteApps]"), Xo = "Error while initializing PostHog app with config id ";
	function Qo(t, e, i) {
		if (D(t)) return !1;
		switch (i) {
			case "exact": return t === e;
			case "contains":
				var r = e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/_/g, ".").replace(/%/g, ".*");
				return new RegExp(r, "i").test(t);
			case "regex": try {
				return new RegExp(e).test(t);
			} catch (t) {
				return !1;
			}
			default: return !1;
		}
	}
	var Zo = class {
		constructor(t) {
			this.vn = new dn(), this.fn = (t, e) => this.pn(t, e) && this.gn(t, e) && this.mn(t, e) && this.yn(t, e), this.pn = (t, e) => null == e || !e.event || (null == t ? void 0 : t.event) === (null == e ? void 0 : e.event), this._instance = t, this.bn = /* @__PURE__ */ new Set(), this.wn = /* @__PURE__ */ new Set();
		}
		init() {
			var t, e;
			C(null == (t = this._instance) ? void 0 : t._addCaptureHook) || null == (e = this._instance) || e._addCaptureHook(((t, e) => {
				this.on(t, e);
			}));
		}
		register(t) {
			var e, i;
			if (!C(null == (e = this._instance) ? void 0 : e._addCaptureHook) && (t.forEach(((t) => {
				var e, i;
				null == (e = this.wn) || e.add(t), null == (i = t.steps) || i.forEach(((t) => {
					var e;
					null == (e = this.bn) || e.add((null == t ? void 0 : t.event) || "");
				}));
			})), null != (i = this._instance) && i.autocapture)) {
				var r, s = /* @__PURE__ */ new Set();
				t.forEach(((t) => {
					var e;
					null == (e = t.steps) || e.forEach(((t) => {
						null != t && t.selector && s.add(null == t ? void 0 : t.selector);
					}));
				})), null == (r = this._instance) || r.autocapture.setElementSelectors(s);
			}
		}
		on(t, e) {
			var i;
			null != e && 0 != t.length && (this.bn.has(t) || this.bn.has(null == e ? void 0 : e.event)) && this.wn && (null == (i = this.wn) ? void 0 : i.size) > 0 && this.wn.forEach(((t) => {
				this._n(e, t) && this.vn.emit("actionCaptured", t.name);
			}));
		}
		In(t) {
			this.onAction("actionCaptured", ((e) => t(e)));
		}
		_n(t, e) {
			if (null == (null == e ? void 0 : e.steps)) return !1;
			for (var i of e.steps) if (this.fn(t, i)) return !0;
			return !1;
		}
		onAction(t, e) {
			return this.vn.on(t, e);
		}
		gn(t, e) {
			if (null != e && e.url) {
				var i, r = null == t || null == (i = t.properties) ? void 0 : i.$current_url;
				if (!r || "string" != typeof r) return !1;
				if (!Qo(r, e.url, e.url_matching || "contains")) return !1;
			}
			return !0;
		}
		mn(t, e) {
			return !!this.Cn(t, e) && !!this.Sn(t, e) && !!this.xn(t, e);
		}
		Cn(t, e) {
			var i;
			if (null == e || !e.href) return !0;
			var r = this.kn(t);
			if (r.length > 0) return r.some(((t) => Qo(t.href, e.href, e.href_matching || "exact")));
			var s, n = (null == t || null == (i = t.properties) ? void 0 : i.$elements_chain) || "";
			return !!n && Qo((s = n.match(/(?::|")href="(.*?)"/)) ? s[1] : "", e.href, e.href_matching || "exact");
		}
		Sn(t, e) {
			var i;
			if (null == e || !e.text) return !0;
			var r = this.kn(t);
			if (r.length > 0) return r.some(((t) => Qo(t.text, e.text, e.text_matching || "exact") || Qo(t.$el_text, e.text, e.text_matching || "exact")));
			var s, n, o, a = (null == t || null == (i = t.properties) ? void 0 : i.$elements_chain) || "";
			return !!a && (s = function(t) {
				for (var e, i = [], r = /(?::|")text="(.*?)"/g; !D(e = r.exec(t));) i.includes(e[1]) || i.push(e[1]);
				return i;
			}(a), n = e.text, o = e.text_matching || "exact", s.some(((t) => Qo(t, n, o))));
		}
		xn(t, e) {
			var i, r;
			if (null == e || !e.selector) return !0;
			var s = null == t || null == (i = t.properties) ? void 0 : i.$element_selectors;
			if (null != s && s.includes(e.selector)) return !0;
			var n = (null == t || null == (r = t.properties) ? void 0 : r.$elements_chain) || "";
			if (e.selector_regex && n) try {
				return new RegExp(e.selector_regex).test(n);
			} catch (t) {
				return !1;
			}
			return !1;
		}
		kn(t) {
			var e;
			return null == (null == t || null == (e = t.properties) ? void 0 : e.$elements) ? [] : null == t ? void 0 : t.properties.$elements;
		}
		yn(t, e) {
			return null == e || !e.properties || 0 === e.properties.length || bn(e.properties.reduce(((t, e) => {
				var i = R(e.value) ? e.value.map(String) : null != e.value ? [String(e.value)] : [];
				return t[e.key] = {
					values: i,
					operator: e.operator || "exact"
				}, t;
			}), {}), null == t ? void 0 : t.properties);
		}
	};
	var ta = class {
		constructor(t) {
			this._instance = t, this.Tn = /* @__PURE__ */ new Map(), this.An = /* @__PURE__ */ new Map(), this.En = /* @__PURE__ */ new Map();
		}
		Rn(t, e) {
			return !!t && bn(t.propertyFilters, null == e ? void 0 : e.properties);
		}
		Nn(t, e) {
			var i = /* @__PURE__ */ new Map();
			return t.forEach(((t) => {
				var r;
				null == (r = t.conditions) || null == (r = r[e]) || null == (r = r.values) || r.forEach(((e) => {
					if (null != e && e.name) {
						var r = i.get(e.name) || [];
						r.push(t.id), i.set(e.name, r);
					}
				}));
			})), i;
		}
		Mn(t, e, i) {
			var r = (i === Kr.Activation ? this.Tn : this.An).get(t), s = [];
			return this.Fn(((t) => {
				s = t.filter(((t) => null == r ? void 0 : r.includes(t.id)));
			})), s.filter(((r) => {
				var s, n = null == (s = r.conditions) || null == (s = s[i]) || null == (s = s.values) ? void 0 : s.find(((e) => e.name === t));
				return this.Rn(n, e);
			}));
		}
		register(t) {
			var e;
			C(null == (e = this._instance) ? void 0 : e._addCaptureHook) || (this.On(t), this.Pn(t));
		}
		Pn(t) {
			var e = t.filter(((t) => {
				var e, i;
				return (null == (e = t.conditions) ? void 0 : e.actions) && (null == (i = t.conditions) || null == (i = i.actions) || null == (i = i.values) ? void 0 : i.length) > 0;
			}));
			0 !== e.length && (this.Ln ?? (this.Ln = new Zo(this._instance), this.Ln.init(), this.Ln.In(((t) => {
				this.onAction(t);
			}))), e.forEach(((t) => {
				var e, i, r, s, n;
				t.conditions && null != (e = t.conditions) && e.actions && null != (i = t.conditions) && null != (i = i.actions) && i.values && (null == (r = t.conditions) || null == (r = r.actions) || null == (r = r.values) ? void 0 : r.length) > 0 && (null == (s = this.Ln) || s.register(t.conditions.actions.values), null == (n = t.conditions) || null == (n = n.actions) || null == (n = n.values) || n.forEach(((e) => {
					if (e && e.name) {
						var i = this.En.get(e.name);
						i && i.push(t.id), this.En.set(e.name, i || [t.id]);
					}
				})));
			})));
		}
		On(t) {
			var e, i = t.filter(((t) => {
				var e, i;
				return (null == (e = t.conditions) ? void 0 : e.events) && (null == (i = t.conditions) || null == (i = i.events) || null == (i = i.values) ? void 0 : i.length) > 0;
			})), r = t.filter(((t) => {
				var e, i;
				return (null == (e = t.conditions) ? void 0 : e.cancelEvents) && (null == (i = t.conditions) || null == (i = i.cancelEvents) || null == (i = i.values) ? void 0 : i.length) > 0;
			}));
			0 === i.length && 0 === r.length || (null == (e = this._instance) || e._addCaptureHook(((t, e) => {
				this.onEvent(t, e);
			})), this.Tn = this.Nn(t, Kr.Activation), this.An = this.Nn(t, Kr.Cancellation));
		}
		onEvent(t, e) {
			var i, r = this.le(), s = this.Dn(), n = this.Bn(), o = (null == (i = this._instance) || null == (i = i.persistence) ? void 0 : i.props[s]) || [];
			if (n === t && e && o.length > 0) {
				var a, l;
				r.info("event matched, removing item from activated items", {
					event: t,
					eventPayload: e,
					existingActivatedItems: o
				});
				var u = (null == e || null == (a = e.properties) ? void 0 : a.$survey_id) || (null == e || null == (l = e.properties) ? void 0 : l.$product_tour_id);
				if (u) {
					var h = o.indexOf(u);
					0 > h || (o.splice(h, 1), this.jn(o));
				}
			} else {
				if (this.An.has(t)) {
					var d = this.Mn(t, e, Kr.Cancellation);
					d.length > 0 && (r.info("cancel event matched, cancelling items", {
						event: t,
						itemsToCancel: d.map(((t) => t.id))
					}), d.forEach(((t) => {
						var e = o.indexOf(t.id);
						0 > e || o.splice(e, 1), this.$n(t.id);
					})), this.jn(o));
				}
				if (this.Tn.has(t)) {
					r.info("event name matched", {
						event: t,
						eventPayload: e,
						items: this.Tn.get(t)
					});
					var v = this.Mn(t, e, Kr.Activation);
					this.jn(o.concat(v.map(((t) => t.id)) || []));
				}
			}
		}
		onAction(t) {
			var e, i = this.Dn(), r = (null == (e = this._instance) || null == (e = e.persistence) ? void 0 : e.props[i]) || [];
			this.En.has(t) && this.jn(r.concat(this.En.get(t) || []));
		}
		jn(t) {
			var e = this.le(), i = [...new Set(t)].filter(((t) => !this.qn(t)));
			e.info("updating activated items", { activatedItems: i }), this.Zn(i);
		}
		getActivatedIds() {
			var t, e = this.Dn();
			return (null == (t = this._instance) || null == (t = t.persistence) ? void 0 : t.props[e]) || [];
		}
		getEventToItemsMap() {
			return this.Tn;
		}
		Hn() {
			return this.Ln;
		}
	};
	var ea = class extends ta {
		constructor(t) {
			super(t);
		}
		Dn() {
			return ci;
		}
		Bn() {
			return ss.SHOWN;
		}
		Fn(t) {
			var e;
			null == (e = this._instance) || e.getSurveys(t);
		}
		$n(t) {
			var e;
			null == (e = this._instance) || e.cancelPendingSurvey(t);
		}
		le() {
			return Tn;
		}
		Zn(t) {
			var e;
			null == (e = this._instance) || null == (e = e.persistence) || e.register({ [ci]: t });
		}
		qn() {
			return !1;
		}
		getSurveys() {
			return this.getActivatedIds();
		}
		getEventToSurveys() {
			return this.getEventToItemsMap();
		}
	};
	var ia = "SDK is not enabled or survey functionality is not yet loaded", ra = "Disabled. Not loading surveys.", sa = null != t && t.location ? Cr(t.location.hash, "__posthog") || Cr(location.hash, "state") : null, na = "_postHogToolbarParams", oa = Ae("[Toolbar]"), aa = Ae("[FeatureFlags]"), la = Ae("[FeatureFlags]", { debugEnabled: !0 }), ua = "\" failed. Feature flags didn't load in time.", ha = (t) => {
		for (var e = {}, i = 0; t.length > i; i++) e[t[i]] = !0;
		return e;
	}, da = (t) => {
		var e = {};
		for (var [i, r] of Wi(t || {})) r && (e[i] = r);
		return e;
	}, va = Ae("[Error tracking]"), ca = "Refusing to render web experiment since the viewer is a likely bot", pa = {
		icontains: (e, i) => !!t && i.href.toLowerCase().indexOf(e.toLowerCase()) > -1,
		not_icontains: (e, i) => !!t && -1 === i.href.toLowerCase().indexOf(e.toLowerCase()),
		regex: (e, i) => !!t && fn(i.href, e),
		not_regex: (e, i) => !!t && !fn(i.href, e),
		exact: (t, e) => e.href === t,
		is_not: (t, e) => e.href !== t
	};
	var fa = class fa {
		get Bt() {
			return this._instance.config;
		}
		constructor(t) {
			var e = this;
			this.getWebExperimentsAndEvaluateDisplayLogic = function(t) {
				void 0 === t && (t = !1), e.getWebExperiments(((t) => {
					fa.Vn("retrieved web experiments from the server"), e.zn = /* @__PURE__ */ new Map(), t.forEach(((t) => {
						if (t.feature_flag_key) {
							var i;
							e.zn && (fa.Vn("setting flag key ", t.feature_flag_key, " to web experiment ", t), null == (i = e.zn) || i.set(t.feature_flag_key, t));
							var r = e._instance.getFeatureFlag(t.feature_flag_key);
							A(r) && t.variants[r] && e.Un(t.name, r, t.variants[r].transforms);
						} else if (t.variants) for (var s in t.variants) {
							var n = t.variants[s];
							fa.Yn(n) && e.Un(t.name, s, n.transforms);
						}
					}));
				}), t);
			}, this._instance = t, this._instance.onFeatureFlags(((t) => {
				this.onFeatureFlags(t);
			}));
		}
		initialize() {}
		onFeatureFlags(t) {
			if (this._is_bot()) fa.Vn(ca);
			else if (!this.Bt.disable_web_experiments) {
				if (D(this.zn)) return this.zn = /* @__PURE__ */ new Map(), this.loadIfEnabled(), void this.previewWebExperiment();
				fa.Vn("applying feature flags", t), t.forEach(((t) => {
					var e;
					if (this.zn && null != (e = this.zn) && e.has(t)) {
						var i, r = this._instance.getFeatureFlag(t), s = null == (i = this.zn) ? void 0 : i.get(t);
						r && null != s && s.variants[r] && this.Un(s.name, r, s.variants[r].transforms);
					}
				}));
			}
		}
		previewWebExperiment() {
			var t = fa.getWindowLocation();
			if (null != t && t.search) {
				var e = Or(null == t ? void 0 : t.search, "__experiment_id"), i = Or(null == t ? void 0 : t.search, "__experiment_variant");
				e && i && (fa.Vn("previewing web experiments " + e + " && " + i), this.getWebExperiments(((t) => {
					this.Gn(parseInt(e), i, t);
				}), !1, !0));
			}
		}
		loadIfEnabled() {
			this.Bt.disable_web_experiments || this.getWebExperimentsAndEvaluateDisplayLogic();
		}
		getWebExperiments(t, e, i) {
			if (this.Bt.disable_web_experiments && !i) return t([]);
			var r = this._instance.get_property("$web_experiments");
			if (r && !e) return t(r);
			this._instance._send_request({
				url: this._instance.requestRouter.endpointFor("api", "/api/web_experiments/?token=" + this.Bt.token),
				method: "GET",
				callback: (e) => t(200 === e.statusCode && e.json && e.json.experiments || [])
			});
		}
		Gn(t, e, i) {
			var r = i.filter(((e) => e.id === t));
			r && r.length > 0 && (fa.Vn("Previewing web experiment [" + r[0].name + "] with variant [" + e + "]"), this.Un(r[0].name, e, r[0].variants[e].transforms));
		}
		static Yn(t) {
			return !D(t.conditions) && fa.Wn(t) && fa.Xn(t);
		}
		static Wn(t) {
			var e;
			if (D(t.conditions) || D(null == (e = t.conditions) ? void 0 : e.url)) return !0;
			var i, r, s, n = fa.getWindowLocation();
			return !!n && (null == (i = t.conditions) || !i.url || pa[null !== (r = null == (s = t.conditions) ? void 0 : s.urlMatchType) && void 0 !== r ? r : "icontains"](t.conditions.url, n));
		}
		static getWindowLocation() {
			return null == t ? void 0 : t.location;
		}
		static Xn(t) {
			var e;
			if (D(t.conditions) || D(null == (e = t.conditions) ? void 0 : e.utm)) return !0;
			var i = Ur();
			if (i.utm_source) {
				var r, s, n, o, a, l, u, h, d = null == (r = t.conditions) || null == (r = r.utm) || !r.utm_campaign || (null == (s = t.conditions) || null == (s = s.utm) ? void 0 : s.utm_campaign) == i.utm_campaign, v = null == (n = t.conditions) || null == (n = n.utm) || !n.utm_source || (null == (o = t.conditions) || null == (o = o.utm) ? void 0 : o.utm_source) == i.utm_source, c = null == (a = t.conditions) || null == (a = a.utm) || !a.utm_medium || (null == (l = t.conditions) || null == (l = l.utm) ? void 0 : l.utm_medium) == i.utm_medium, p = null == (u = t.conditions) || null == (u = u.utm) || !u.utm_term || (null == (h = t.conditions) || null == (h = h.utm) ? void 0 : h.utm_term) == i.utm_term;
				return d && c && p && v;
			}
			return !1;
		}
		static Vn(t) {
			for (var e = arguments.length, i = new Array(e > 1 ? e - 1 : 0), r = 1; e > r; r++) i[r - 1] = arguments[r];
			Ce.info("[WebExperiments] " + t, i);
		}
		Un(t, e, i) {
			this._is_bot() ? fa.Vn(ca) : "control" !== e ? i.forEach(((i) => {
				if (i.selector) {
					var r;
					fa.Vn("applying transform of variant " + e + " for experiment " + t + " ", i);
					(null == (r = document) ? void 0 : r.querySelectorAll(i.selector))?.forEach(((t) => {
						var e = t;
						i.html && (e.innerHTML = i.html), i.css && e.setAttribute("style", i.css);
					}));
				}
			})) : fa.Vn("Control variants leave the page unmodified.");
		}
		_is_bot() {
			return i && this._instance ? pn(i, this.Bt.custom_blocked_useragents) : void 0;
		}
	};
	var _a = Ae("[Conversations]"), ga = "Conversations not available yet.", ma = { featureFlags: class {
		constructor(t) {
			this.Jn = !1, this.Kn = !1, this.Qn = !1, this.es = !1, this.ts = !1, this.rs = !1, this.ns = !1, this.ss = !1, this._instance = t, this.featureFlagEventHandlers = [];
		}
		get Bt() {
			return this._instance.config;
		}
		get ni() {
			return this._instance.persistence;
		}
		os(t) {
			return this._instance.get_property(t);
		}
		ls() {
			var t, e;
			return null !== (t = null == (e = this.ni) ? void 0 : e._r(this.Bt.feature_flag_cache_ttl_ms)) && void 0 !== t && t;
		}
		us() {
			return !!this.ls() && (this.ss || this.Qn || (this.ss = !0, aa.warn("Feature flag cache is stale, triggering refresh..."), this.reloadFeatureFlags()), !0);
		}
		hs() {
			var t, e = null !== (t = this.Bt.evaluation_contexts) && void 0 !== t ? t : this.Bt.evaluation_environments;
			return !this.Bt.evaluation_environments || this.Bt.evaluation_contexts || this.ns || (aa.warn("evaluation_environments is deprecated. Use evaluation_contexts instead. evaluation_environments will be removed in a future version."), this.ns = !0), null != e && e.length ? e.filter(((t) => {
				var e = t && "string" == typeof t && t.trim().length > 0;
				return e || aa.error("Invalid evaluation context found:", t, "Expected non-empty string"), e;
			})) : [];
		}
		cs() {
			return this.hs().length > 0;
		}
		initialize() {
			var t, e, { config: i } = this._instance, r = null !== (t = null == (e = i.bootstrap) ? void 0 : e.featureFlags) && void 0 !== t ? t : {};
			if (Object.keys(r).length) {
				var s, n, o = null !== (s = null == (n = i.bootstrap) ? void 0 : n.featureFlagPayloads) && void 0 !== s ? s : {}, a = Object.keys(r).filter(((t) => !!r[t])).reduce(((t, e) => (t[e] = r[e] || !1, t)), {}), l = Object.keys(o).filter(((t) => a[t])).reduce(((t, e) => (o[e] && (t[e] = o[e]), t)), {});
				this.receivedFeatureFlags({
					featureFlags: a,
					featureFlagPayloads: l
				});
			}
		}
		updateFlags(t, e, i) {
			var r = null != i && i.merge ? this.getFlagVariants() : {}, s = null != i && i.merge ? this.getFlagPayloads() : {}, n = f({}, r, t), o = f({}, s, e), a = {};
			for (var [l, u] of Object.entries(n)) {
				var h = "string" == typeof u;
				a[l] = {
					key: l,
					enabled: !!h || Boolean(u),
					variant: h ? u : void 0,
					reason: void 0,
					metadata: C(null == o ? void 0 : o[l]) ? void 0 : {
						id: 0,
						version: void 0,
						description: void 0,
						payload: o[l]
					}
				};
			}
			this.receivedFeatureFlags({ flags: a });
		}
		get hasLoadedFlags() {
			return this.Kn;
		}
		getFlags() {
			return Object.keys(this.getFlagVariants());
		}
		getFlagsWithDetails() {
			var t = this.os(ni), e = this.os(li), i = this.os(ui);
			if (!i && !e) return t || {};
			var r = Vi({}, t || {});
			for (var n of [...new Set([...Object.keys(i || {}), ...Object.keys(e || {})])]) {
				var o, a, l = r[n], u = null == e ? void 0 : e[n], h = C(u) ? null !== (o = null == l ? void 0 : l.enabled) && void 0 !== o && o : !!u, d = C(u) ? l.variant : "string" == typeof u ? u : void 0, v = null == i ? void 0 : i[n], c = f({}, l, {
					enabled: h,
					variant: h ? null != d ? d : null == l ? void 0 : l.variant : void 0
				});
				h !== (null == l ? void 0 : l.enabled) && (c.original_enabled = null == l ? void 0 : l.enabled), d !== (null == l ? void 0 : l.variant) && (c.original_variant = null == l ? void 0 : l.variant), v && (c.metadata = f({}, null == l ? void 0 : l.metadata, {
					payload: v,
					original_payload: null == l || null == (a = l.metadata) ? void 0 : a.payload
				})), r[n] = c;
			}
			return this.Jn || (aa.warn(" Overriding feature flag details!", {
				flagDetails: t,
				overriddenPayloads: i,
				finalDetails: r
			}), this.Jn = !0), r;
		}
		getFlagVariants() {
			var t = this.os(ii), e = this.os(li);
			if (!e) return t || {};
			for (var i = Vi({}, t), r = Object.keys(e), s = 0; r.length > s; s++) i[r[s]] = e[r[s]];
			return this.Jn || (aa.warn(" Overriding feature flags!", {
				enabledFlags: t,
				overriddenFlags: e,
				finalFlags: i
			}), this.Jn = !0), i;
		}
		getFlagPayloads() {
			var t = this.os(oi), e = this.os(ui);
			if (!e) return t || {};
			for (var i = Vi({}, t || {}), r = Object.keys(e), s = 0; r.length > s; s++) i[r[s]] = e[r[s]];
			return this.Jn || (aa.warn(" Overriding feature flag payloads!", {
				flagPayloads: t,
				overriddenPayloads: e,
				finalPayloads: i
			}), this.Jn = !0), i;
		}
		reloadFeatureFlags() {
			this.es || this.Bt.advanced_disable_feature_flags || this.ds || (this._instance.Fi.emit("featureFlagsReloading", !0), this.ds = setTimeout((() => {
				this.vs();
			}), 5));
		}
		fs() {
			clearTimeout(this.ds), this.ds = void 0;
		}
		ensureFlagsLoaded() {
			this.Kn || this.Qn || this.ds || this.reloadFeatureFlags();
		}
		setAnonymousDistinctId(t) {
			this.$anon_distinct_id = t;
		}
		setReloadingPaused(t) {
			this.es = t;
		}
		vs(t) {
			var e;
			if (this.fs(), !this._instance.Fr()) if (this.Qn) this.ts = !0;
			else {
				var i = this.Bt.token, r = this.os(Le), s = {
					token: i,
					distinct_id: this._instance.get_distinct_id(),
					groups: this._instance.getGroups(),
					$anon_distinct_id: this.$anon_distinct_id,
					person_properties: f({}, (null == (e = this.ni) ? void 0 : e.get_initial_props()) || {}, this.os(hi) || {}),
					group_properties: this.os(di),
					timezone: Wr()
				};
				M(r) || C(r) || (s.$device_id = r), (null != t && t.disableFlags || this.Bt.advanced_disable_feature_flags) && (s.disable_flags = !0), this.cs() && (s.evaluation_contexts = this.hs());
				var n = this._instance.requestRouter.endpointFor("flags", "/flags/?v=2" + (this.Bt.advanced_only_evaluate_survey_feature_flags ? "&only_evaluate_survey_feature_flags=true" : ""));
				this.Qn = !0, this._instance._send_request({
					method: "POST",
					url: n,
					data: s,
					compression: this.Bt.disable_compression ? void 0 : fs.Base64,
					timeout: this.Bt.feature_flag_request_timeout_ms,
					callback: (t) => {
						var e, i, r, n = !0;
						if (200 === t.statusCode && (this.ts || (this.$anon_distinct_id = void 0), n = !1), this.Qn = !1, !s.disable_flags || this.ts) {
							this.rs = !n;
							var o = [];
							t.error ? t.error instanceof Error ? o.push("AbortError" === t.error.name ? "timeout" : "connection_error") : o.push("unknown_error") : 200 !== t.statusCode && o.push("api_error_" + t.statusCode), null != (e = t.json) && e.errorsWhileComputingFlags && o.push("errors_while_computing_flags");
							var a, l = !(null == (i = t.json) || null == (i = i.quotaLimited) || !i.includes("feature_flags"));
							if (l && o.push("quota_limited"), null == (r = this.ni) || r.register({ [gi]: o }), l) aa.warn("You have hit your feature flags quota limit, and will not be able to load feature flags until the quota is reset.  Please visit https://posthog.com/docs/billing/limits-alerts to learn more.");
							else s.disable_flags || this.receivedFeatureFlags(null !== (a = t.json) && void 0 !== a ? a : {}, n, { partialResponse: !!this.Bt.advanced_only_evaluate_survey_feature_flags }), this.ts && (this.ts = !1, this.vs());
						}
					}
				});
			}
		}
		getFeatureFlag(t, e) {
			var i;
			if (void 0 === e && (e = {}), !e.fresh || this.rs) if (this.Kn || this.getFlags() && this.getFlags().length > 0) {
				if (!this.us()) {
					var r = this.getFeatureFlagResult(t, e);
					return null !== (i = null == r ? void 0 : r.variant) && void 0 !== i ? i : null == r ? void 0 : r.enabled;
				}
			} else aa.warn("getFeatureFlag for key \"" + t + ua);
		}
		getFeatureFlagDetails(t) {
			return this.getFlagsWithDetails()[t];
		}
		getFeatureFlagPayload(t) {
			var e = this.getFeatureFlagResult(t, { send_event: !1 });
			return null == e ? void 0 : e.payload;
		}
		getFeatureFlagResult(t, e) {
			if (void 0 === e && (e = {}), !e.fresh || this.rs) if (this.Kn || this.getFlags() && this.getFlags().length > 0) {
				if (!this.us()) {
					var i = this.getFlagVariants(), r = t in i, s = i[t], n = this.getFlagPayloads()[t], o = String(s), a = this.os(ai) || void 0, l = this.os(mi) || void 0, u = this.os(fi) || {};
					if (this.Bt.advanced_feature_flags_dedup_per_session) {
						var h, d = this._instance.get_session_id(), v = this.os(_i);
						d && d !== v && (u = {}, null == (h = this.ni) || h.register({
							[fi]: u,
							[_i]: d
						}));
					}
					if ((e.send_event || !("send_event" in e)) && (!(t in u) || !u[t].includes(o))) {
						var c, p, f, _, g, m, b, y, w, x;
						R(u[t]) ? u[t].push(o) : u[t] = [o], null == (c = this.ni) || c.register({ [fi]: u });
						var E = this.getFeatureFlagDetails(t), S = [...null !== (p = this.os(gi)) && void 0 !== p ? p : []];
						C(s) && S.push("flag_missing");
						var T = {
							$feature_flag: t,
							$feature_flag_response: s,
							$feature_flag_payload: n || null,
							$feature_flag_request_id: a,
							$feature_flag_evaluated_at: l,
							$feature_flag_bootstrapped_response: (null == (f = this.Bt.bootstrap) || null == (f = f.featureFlags) ? void 0 : f[t]) || null,
							$feature_flag_bootstrapped_payload: (null == (_ = this.Bt.bootstrap) || null == (_ = _.featureFlagPayloads) ? void 0 : _[t]) || null,
							$used_bootstrap_value: !this.rs
						};
						C(null == E || null == (g = E.metadata) ? void 0 : g.version) || (T.$feature_flag_version = E.metadata.version);
						var k, P = null !== (m = null == E || null == (b = E.reason) ? void 0 : b.description) && void 0 !== m ? m : null == E || null == (y = E.reason) ? void 0 : y.code;
						P && (T.$feature_flag_reason = P), null != E && null != (w = E.metadata) && w.id && (T.$feature_flag_id = E.metadata.id), C(null == E ? void 0 : E.original_variant) && C(null == E ? void 0 : E.original_enabled) || (T.$feature_flag_original_response = C(E.original_variant) ? E.original_enabled : E.original_variant), null != E && null != (x = E.metadata) && x.original_payload && (T.$feature_flag_original_payload = null == E || null == (k = E.metadata) ? void 0 : k.original_payload), S.length && (T.$feature_flag_error = S.join(",")), this._instance.capture("$feature_flag_called", T);
					}
					if (r) {
						var O = n;
						if (!C(n)) try {
							O = JSON.parse(n);
						} catch (t) {}
						return {
							key: t,
							enabled: !!s,
							variant: "string" == typeof s ? s : void 0,
							payload: O
						};
					}
				}
			} else aa.warn("getFeatureFlagResult for key \"" + t + ua);
		}
		getRemoteConfigPayload(t, e) {
			var i = this.Bt.token, r = {
				distinct_id: this._instance.get_distinct_id(),
				token: i
			};
			this.cs() && (r.evaluation_contexts = this.hs()), this._instance._send_request({
				method: "POST",
				url: this._instance.requestRouter.endpointFor("flags", "/flags/?v=2"),
				data: r,
				compression: this.Bt.disable_compression ? void 0 : fs.Base64,
				timeout: this.Bt.feature_flag_request_timeout_ms,
				callback(i) {
					var r, s = null == (r = i.json) ? void 0 : r.featureFlagPayloads;
					e((null == s ? void 0 : s[t]) || void 0);
				}
			});
		}
		isFeatureEnabled(t, e) {
			if (void 0 === e && (e = {}), !e.fresh || this.rs) {
				if (this.Kn || this.getFlags() && this.getFlags().length > 0) {
					var i = this.getFeatureFlag(t, e);
					return C(i) ? void 0 : !!i;
				}
				aa.warn("isFeatureEnabled for key \"" + t + ua);
			}
		}
		addFeatureFlagsHandler(t) {
			this.featureFlagEventHandlers.push(t);
		}
		removeFeatureFlagsHandler(t) {
			this.featureFlagEventHandlers = this.featureFlagEventHandlers.filter(((e) => e !== t));
		}
		receivedFeatureFlags(t, e, i) {
			if (this.ni) {
				this.Kn = !0;
				var r = this.getFlagVariants(), s = this.getFlagPayloads(), n = this.getFlagsWithDetails();
				(function(t, e, i, r, s, n) {
					void 0 === i && (i = {}), void 0 === r && (r = {}), void 0 === s && (s = {});
					var o = ((t) => {
						var e = t.flags;
						return e ? (t.featureFlags = Object.fromEntries(Object.keys(e).map(((t) => {
							var i;
							return [t, null !== (i = e[t].variant) && void 0 !== i ? i : e[t].enabled];
						}))), t.featureFlagPayloads = Object.fromEntries(Object.keys(e).filter(((t) => e[t].enabled)).filter(((t) => {
							var i;
							return null == (i = e[t].metadata) ? void 0 : i.payload;
						})).map(((t) => {
							var i;
							return [t, null == (i = e[t].metadata) ? void 0 : i.payload];
						})))) : aa.warn("Using an older version of the feature flags endpoint. Please upgrade your PostHog server to the latest version"), t;
					})(t), a = o.flags, l = o.featureFlags, u = o.featureFlagPayloads;
					if (l) {
						var h = t.requestId, d = t.evaluatedAt;
						if (R(l)) {
							aa.warn("v1 of the feature flags endpoint is deprecated. Please use the latest version.");
							var v = {};
							if (l) for (var c = 0; l.length > c; c++) v[l[c]] = !0;
							e && e.register({
								[ri]: l,
								[ii]: v
							});
						} else {
							var p = l, _ = u, g = a;
							if (null != n && n.partialResponse) p = f({}, i, p), _ = f({}, r, _), g = f({}, s, g);
							else if (t.errorsWhileComputingFlags) if (a) {
								var m = new Set(Object.keys(a).filter(((t) => {
									var e;
									return !(null != (e = a[t]) && e.failed);
								})));
								p = f({}, i, Object.fromEntries(Object.entries(p).filter(((t) => {
									var [e] = t;
									return m.has(e);
								})))), _ = f({}, r, Object.fromEntries(Object.entries(_ || {}).filter(((t) => {
									var [e] = t;
									return m.has(e);
								})))), g = f({}, s, Object.fromEntries(Object.entries(g || {}).filter(((t) => {
									var [e] = t;
									return m.has(e);
								}))));
							} else p = f({}, i, p), _ = f({}, r, _), g = f({}, s, g);
							e && e.register(f({
								[ri]: Object.keys(da(p)),
								[ii]: p || {},
								[oi]: _ || {},
								[ni]: g || {}
							}, h ? { [ai]: h } : {}, d ? { [mi]: d } : {}));
						}
					}
				})(t, this.ni, r, s, n, i), e || (this.ss = !1), this.ps(e);
			}
		}
		override(t, e) {
			void 0 === e && (e = !1), aa.warn("override is deprecated. Please use overrideFeatureFlags instead."), this.overrideFeatureFlags({
				flags: t,
				suppressWarning: e
			});
		}
		overrideFeatureFlags(t) {
			if (!this._instance.__loaded || !this.ni) return aa.uninitializedWarning("posthog.featureFlags.overrideFeatureFlags");
			if (!1 === t) return this.ni.unregister(li), this.ni.unregister(ui), this.ps(), la.info("All overrides cleared");
			if (R(t)) {
				var e = ha(t);
				return this.ni.register({ [li]: e }), this.ps(), la.info("Flag overrides set", { flags: t });
			}
			if (t && "object" == typeof t && ("flags" in t || "payloads" in t)) {
				var i, r = t;
				if (this.Jn = Boolean(null !== (i = r.suppressWarning) && void 0 !== i && i), "flags" in r) {
					if (!1 === r.flags) this.ni.unregister(li), la.info("Flag overrides cleared");
					else if (r.flags) {
						if (R(r.flags)) {
							var s = ha(r.flags);
							this.ni.register({ [li]: s });
						} else this.ni.register({ [li]: r.flags });
						la.info("Flag overrides set", { flags: r.flags });
					}
				}
				"payloads" in r && (!1 === r.payloads ? (this.ni.unregister(ui), la.info("Payload overrides cleared")) : r.payloads && (this.ni.register({ [ui]: r.payloads }), la.info("Payload overrides set", { payloads: r.payloads }))), this.ps();
				return;
			}
			if (t && "object" == typeof t) return this.ni.register({ [li]: t }), this.ps(), la.info("Flag overrides set", { flags: t });
			aa.warn("Invalid overrideOptions provided to overrideFeatureFlags", { overrideOptions: t });
		}
		onFeatureFlags(t) {
			if (this.addFeatureFlagsHandler(t), this.Kn) {
				var { flags: e, flagVariants: i } = this.gs();
				t(e, i);
			}
			return () => this.removeFeatureFlagsHandler(t);
		}
		updateEarlyAccessFeatureEnrollment(t, e, i) {
			var r, s = (this.os(si) || []).find(((e) => e.flagKey === t)), n = { ["$feature_enrollment/" + t]: e }, o = {
				$feature_flag: t,
				$feature_enrollment: e,
				$set: n
			};
			s && (o.$early_access_feature_name = s.name), i && (o.$feature_enrollment_stage = i), this._instance.capture("$feature_enrollment_update", o), this.setPersonPropertiesForFlags(n, !1);
			var a = f({}, this.getFlagVariants(), { [t]: e });
			null == (r = this.ni) || r.register({
				[ri]: Object.keys(da(a)),
				[ii]: a
			}), this.ps();
		}
		getEarlyAccessFeatures(t, e, i) {
			void 0 === e && (e = !1);
			var r = this.os(si), s = i ? "&" + i.map(((t) => "stage=" + t)).join("&") : "";
			if (r && !e) return t(r);
			this._instance._send_request({
				url: this._instance.requestRouter.endpointFor("api", "/api/early_access_features/?token=" + this.Bt.token + s),
				method: "GET",
				callback: (e) => {
					var i, r;
					if (e.json) {
						var s = e.json.earlyAccessFeatures;
						return null == (i = this.ni) || i.unregister(si), null == (r = this.ni) || r.register({ [si]: s }), t(s);
					}
				}
			});
		}
		gs() {
			var t = this.getFlags(), e = this.getFlagVariants();
			return {
				flags: t.filter(((t) => e[t])),
				flagVariants: Object.keys(e).filter(((t) => e[t])).reduce(((t, i) => (t[i] = e[i], t)), {})
			};
		}
		ps(t) {
			var { flags: e, flagVariants: i } = this.gs();
			this.featureFlagEventHandlers.forEach(((r) => r(e, i, { errorsLoading: t })));
		}
		setPersonPropertiesForFlags(t, e) {
			void 0 === e && (e = !0);
			var i = this.os(hi) || {}, r = (null == t ? void 0 : t.$set) || (null != t && t.$set_once ? {} : t), s = null == t ? void 0 : t.$set_once, n = {};
			if (s) for (var o in s) ({}).hasOwnProperty.call(s, o) && (o in i || (n[o] = s[o]));
			this._instance.register({ [hi]: f({}, i, n, r) }), e && this._instance.reloadFeatureFlags();
		}
		resetPersonPropertiesForFlags() {
			this._instance.unregister(hi);
		}
		setGroupPropertiesForFlags(t, e) {
			void 0 === e && (e = !0);
			var i = this.os(di) || {};
			0 !== Object.keys(i).length && Object.keys(i).forEach(((e) => {
				i[e] = f({}, i[e], t[e]), delete t[e];
			})), this._instance.register({ [di]: f({}, i, t) }), e && this._instance.reloadFeatureFlags();
		}
		resetGroupPropertiesForFlags(t) {
			if (t) {
				var e = this.os(di) || {};
				this._instance.register({ [di]: f({}, e, { [t]: {} }) });
			} else this._instance.unregister(di);
		}
		reset() {
			this.Kn = !1, this.Qn = !1, this.es = !1, this.ts = !1, this.rs = !1, this.$anon_distinct_id = void 0, this.fs(), this.Jn = !1;
		}
	} }, ba = { sessionRecording: class {
		get Bt() {
			return this._instance.config;
		}
		get ni() {
			return this._instance.persistence;
		}
		get started() {
			var t;
			return !(null == (t = this.ys) || !t.isStarted);
		}
		get status() {
			var t, e;
			return this.bs === Bo || this.bs === Ho ? this.bs : null !== (t = null == (e = this.ys) ? void 0 : e.status) && void 0 !== t ? t : this.bs;
		}
		constructor(t) {
			if (this._forceAllowLocalhostNetworkCapture = !1, this.bs = jo, this.ws = void 0, this._instance = t, !this._instance.sessionManager) throw Vo.error("started without valid sessionManager"), /* @__PURE__ */ new Error(qo + " started without valid sessionManager. This is a bug.");
			if (this.Bt.cookieless_mode === Ai) throw new Error(qo + " cannot be used with cookieless_mode=\"always\"");
		}
		initialize() {
			this.startIfEnabledOrStop();
		}
		get _s() {
			var e, i = !(null == (e = this._instance.get_property(Je)) || !e.enabled), r = !this.Bt.disable_session_recording, s = this.Bt.disable_session_recording || this._instance.consent.isOptedOut();
			return t && i && r && !s;
		}
		startIfEnabledOrStop(t) {
			var e;
			if (!this._s || null == (e = this.ys) || !e.isStarted) {
				var i = !C(Object.assign) && !C(Array.from);
				this._s && i ? (this.Is(t), Vo.info("starting")) : (this.bs = jo, this.stopRecording());
			}
		}
		Is(t) {
			var e, i, r;
			this._s && (this.bs !== Bo && this.bs !== Ho && (this.bs = zo), null != h && null != (e = h.__PosthogExtensions__) && null != (e = e.rrweb) && e.record && null != (i = h.__PosthogExtensions__) && i.initSessionRecording ? this.Cs(t) : null == (r = h.__PosthogExtensions__) || null == r.loadExternalDependency || r.loadExternalDependency(this._instance, this.Ss, ((e) => {
				if (e) return Vo.error("could not load recorder", e);
				this.Cs(t);
			})));
		}
		stopRecording() {
			var t, e;
			null == (t = this.ws) || t.call(this), this.ws = void 0, null == (e = this.ys) || e.stop();
		}
		xs() {
			var t, e;
			null == (t = this.ws) || t.call(this), this.ws = void 0, null == (e = this.ys) || e.discard();
		}
		ks() {
			var t;
			null == (t = this.ni) || t.unregister(ei);
		}
		Ts(t, e) {
			if (D(t)) return null;
			var i, r = L(t) ? t : parseFloat(t);
			return "number" != typeof (i = r) || !Number.isFinite(i) || 0 > i || i > 1 ? (Vo.warn(e + " must be between 0 and 1. Ignoring invalid value:", t), null) : r;
		}
		As(t) {
			if (this.ni) {
				var e, i, r = this.ni, s = () => {
					var e, i = !1 === t.sessionRecording ? void 0 : t.sessionRecording, s = this.Ts(null == (e = this.Bt.session_recording) ? void 0 : e.sampleRate, "session_recording.sampleRate"), n = this.Ts(null == i ? void 0 : i.sampleRate, "remote config sampleRate"), o = null != s ? s : n;
					D(o) && this.ks();
					var a = null == i ? void 0 : i.minimumDurationMilliseconds;
					r.register({ [Je]: f({
						cache_timestamp: Date.now(),
						enabled: !!i
					}, i, {
						networkPayloadCapture: f({ capturePerformance: t.capturePerformance }, null == i ? void 0 : i.networkPayloadCapture),
						canvasRecording: {
							enabled: null == i ? void 0 : i.recordCanvas,
							fps: null == i ? void 0 : i.canvasFps,
							quality: null == i ? void 0 : i.canvasQuality
						},
						sampleRate: o,
						minimumDurationMilliseconds: C(a) ? null : a,
						endpoint: null == i ? void 0 : i.endpoint,
						triggerMatchType: null == i ? void 0 : i.triggerMatchType,
						masking: null == i ? void 0 : i.masking,
						urlTriggers: null == i ? void 0 : i.urlTriggers,
						version: null == i ? void 0 : i.version,
						triggerGroups: null == i ? void 0 : i.triggerGroups
					}) });
				};
				s(), null == (e = this.ws) || e.call(this), this.ws = null == (i = this._instance.sessionManager) ? void 0 : i.onSessionId(s);
			}
		}
		onRemoteConfig(t) {
			"sessionRecording" in t ? !1 === t.sessionRecording ? (this.As(t), this.xs()) : (this.As(t), this.startIfEnabledOrStop()) : (this.bs === Bo && (this.bs = Ho, Vo.warn("config refresh failed, recording will not start until page reload")), this.startIfEnabledOrStop());
		}
		log(t, e) {
			var i;
			void 0 === e && (e = "log"), null != (i = this.ys) && i.log ? this.ys.log(t, e) : Vo.warn("log called before recorder was ready");
		}
		get Ss() {
			var t, e, i = null == (t = this._instance) || null == (t = t.persistence) ? void 0 : t.get_property(Je);
			return (null == i || null == (e = i.scriptConfig) ? void 0 : e.script) || "lazy-recorder";
		}
		Es() {
			var t, e = this._instance.get_property(Je);
			if (!e) return !1;
			var i = null !== (t = ("object" == typeof e ? e : JSON.parse(e)).cache_timestamp) && void 0 !== t ? t : Date.now();
			return 36e5 >= Date.now() - i;
		}
		Cs(t) {
			var e, i;
			if (null == (e = h.__PosthogExtensions__) || !e.initSessionRecording) return Vo.warn("Called on script loaded before session recording is available. This can be caused by adblockers."), void this._instance.register_for_session({ [Oi]: !0 });
			if (this.ys || (this.ys = null == (i = h.__PosthogExtensions__) ? void 0 : i.initSessionRecording(this._instance), this.ys._forceAllowLocalhostNetworkCapture = this._forceAllowLocalhostNetworkCapture), !this.Es()) {
				if (this.bs === Ho || this.bs === Bo) return;
				this.bs = Bo, Vo.info("persisted remote config is stale, requesting fresh config before starting"), new cs(this._instance).load();
				return;
			}
			this.bs = zo, this.ys.start(t);
		}
		onRRwebEmit(t) {
			var e;
			null == (e = this.ys) || null == e.onRRwebEmit || e.onRRwebEmit(t);
		}
		overrideLinkedFlag() {
			var t, e;
			this.ys || null == (e = this.ni) || e.register({ [Xe]: !0 }), null == (t = this.ys) || t.overrideLinkedFlag();
		}
		overrideSampling() {
			var t, e;
			this.ys || null == (e = this.ni) || e.register({ [Ke]: !0 }), null == (t = this.ys) || t.overrideSampling();
		}
		overrideTrigger(t) {
			var e, i;
			this.ys || null == (i = this.ni) || i.register({ ["url" === t ? Qe : Ze]: !0 }), null == (e = this.ys) || e.overrideTrigger(t);
		}
		get sdkDebugProperties() {
			var t;
			return (null == (t = this.ys) ? void 0 : t.sdkDebugProperties) || { $recording_status: this.status };
		}
		tryAddCustomEvent(t, e) {
			var i;
			return !(null == (i = this.ys) || !i.tryAddCustomEvent(t, e));
		}
	} }, ya = {
		autocapture: class {
			constructor(t) {
				this.Rs = !1, this.Ns = null, this.Ms = !1, this.instance = t, this.rageclicks = new Po(t.config.rageclick), this.Fs = null;
			}
			initialize() {
				this.startIfEnabled();
			}
			get Bt() {
				var t, e, i = O(this.instance.config.autocapture) ? this.instance.config.autocapture : {};
				return i.url_allowlist = null == (t = i.url_allowlist) ? void 0 : t.map(((t) => new RegExp(t))), i.url_ignorelist = null == (e = i.url_ignorelist) ? void 0 : e.map(((t) => new RegExp(t))), i;
			}
			Os() {
				if (this.isBrowserSupported()) {
					if (t && r) {
						var e = (e) => {
							e = e || (null == t ? void 0 : t.event);
							try {
								this.Ps(e);
							} catch (t) {
								Io.error("Failed to capture event", t);
							}
						};
						if (Qi(r, "submit", e, { capture: !0 }), Qi(r, "change", e, { capture: !0 }), Qi(r, "click", e, { capture: !0 }), this.Bt.capture_copied_text) {
							var i = (e) => {
								e = e || (null == t ? void 0 : t.event);
								try {
									this.Ps(e, Oo);
								} catch (t) {
									Io.error("Failed to capture copy/cut event", t);
								}
							};
							Qi(r, "copy", i, { capture: !0 }), Qi(r, "cut", i, { capture: !0 });
						}
					}
				} else Io.info("Disabling Automatic Event Collection because this browser is not supported");
			}
			startIfEnabled() {
				this.isEnabled && !this.Rs && (this.Os(), this.Rs = !0);
			}
			onRemoteConfig(t) {
				t.elementsChainAsString && (this.Ms = t.elementsChainAsString), this.instance.persistence && this.instance.persistence.register({ [je]: !!t.autocapture_opt_out }), this.Ns = !!t.autocapture_opt_out, this.startIfEnabled();
			}
			setElementSelectors(t) {
				this.Fs = t;
			}
			getElementSelectors(t) {
				var e, i = [];
				return null == (e = this.Fs) || e.forEach(((e) => {
					(null == r ? void 0 : r.querySelectorAll(e))?.forEach(((r) => {
						t === r && i.push(e);
					}));
				})), i;
			}
			get isEnabled() {
				var t, e, i = null == (t = this.instance.persistence) ? void 0 : t.props[je];
				if (M(this.Ns) && !N(i) && !this.instance.Fr()) return !1;
				var r = null !== (e = this.Ns) && void 0 !== e ? e : !!i;
				return !!this.instance.config.autocapture && !r;
			}
			Ps(e, i) {
				if (void 0 === i && (i = "$autocapture"), this.isEnabled) {
					var r, s = ao(e);
					to(s) && (s = s.parentNode || null), "$autocapture" === i && "click" === e.type && e instanceof MouseEvent && this.instance.config.rageclick && null != (r = this.rageclicks) && r.isRageClick(e.clientX, e.clientY, e.timeStamp || (/* @__PURE__ */ new Date()).getTime()) && function(e, i) {
						if (!t || po(e)) return !1;
						var r, s, n;
						if (N(i) ? (r = !!i && co, s = void 0) : (r = null !== (n = null == i ? void 0 : i.css_selector_ignorelist) && void 0 !== n ? n : co, s = null == i ? void 0 : i.content_ignorelist), !1 === r) return !1;
						var { targetElementList: o } = fo(e, !1);
						return !function(t, e) {
							if (!1 === t || C(t)) return !1;
							var i;
							if (!0 === t) i = vo;
							else {
								if (!R(t)) return !1;
								if (t.length > 10) return Ce.error("[PostHog] content_ignorelist array cannot exceed 10 items. Use css_selector_ignorelist for more complex matching."), !1;
								i = t.map(((t) => t.toLowerCase()));
							}
							return e.some(((t) => {
								var { safeText: e, ariaLabel: r } = t;
								return i.some(((t) => e.includes(t) || r.includes(t)));
							}));
						}(s, o.map(((t) => {
							var e;
							return {
								safeText: oo(t).toLowerCase(),
								ariaLabel: (null == (e = t.getAttribute("aria-label")) ? void 0 : e.toLowerCase().trim()) || ""
							};
						}))) && !uo(o, r);
					}(s, this.instance.config.rageclick) && this.Ps(e, "$rageclick");
					var n = i === Oo;
					if (s && function(e, i, r, s, n) {
						var o, a, l, u;
						if (void 0 === r && (r = void 0), !t || po(e)) return !1;
						if (null != (o = r) && o.url_allowlist && !ro(r.url_allowlist)) return !1;
						if (null != (a = r) && a.url_ignorelist && ro(r.url_ignorelist)) return !1;
						if (null != (l = r) && l.dom_event_allowlist) {
							var h = r.dom_event_allowlist;
							if (h && !h.some(((t) => i.type === t))) return !1;
						}
						var { parentIsUsefulElement: d, targetElementList: v } = fo(e, s);
						if (!function(t, e) {
							var i = null == e ? void 0 : e.element_allowlist;
							if (C(i)) return !0;
							var r, s = function(t) {
								if (i.some(((e) => t.tagName.toLowerCase() === e))) return { v: !0 };
							};
							for (var n of t) if (r = s(n)) return r.v;
							return !1;
						}(v, r)) return !1;
						if (!uo(v, null == (u = r) ? void 0 : u.css_selector_allowlist)) return !1;
						var c = t.getComputedStyle(e);
						if (c && "pointer" === c.getPropertyValue("cursor") && "click" === i.type) return !0;
						var p = e.tagName.toLowerCase();
						switch (p) {
							case "html": return !1;
							case "form": return (n || ["submit"]).indexOf(i.type) >= 0;
							case "input":
							case "select":
							case "textarea": return (n || ["change", "click"]).indexOf(i.type) >= 0;
							default: return d ? (n || ["click"]).indexOf(i.type) >= 0 : (n || ["click"]).indexOf(i.type) >= 0 && (lo.indexOf(p) > -1 || "true" === e.getAttribute("contenteditable"));
						}
					}(s, e, this.Bt, n, n ? ["copy", "cut"] : void 0)) {
						var { props: o, explicitNoCapture: a } = Fo(s, {
							e,
							maskAllElementAttributes: this.instance.config.mask_all_element_attributes,
							maskAllText: this.instance.config.mask_all_text,
							elementAttributeIgnoreList: this.Bt.element_attribute_ignorelist,
							elementsChainAsString: this.Ms
						});
						if (a) return !1;
						var l = this.getElementSelectors(s);
						if (l && l.length > 0 && (o.$element_selectors = l), i === Oo) {
							var u, h = no(null == t || null == (u = t.getSelection()) ? void 0 : u.toString()), d = e.type || "clipboard";
							if (!h) return !1;
							o.$selected_content = h, o.$copy_type = d;
						}
						return this.instance.capture(i, o), !0;
					}
				}
			}
			isBrowserSupported() {
				return P(null == r ? void 0 : r.querySelectorAll);
			}
		},
		historyAutocapture: class {
			constructor(e) {
				var i;
				this._instance = e, this.Ls = (null == t || null == (i = t.location) ? void 0 : i.pathname) || "";
			}
			initialize() {
				this.startIfEnabled();
			}
			get isEnabled() {
				return "history_change" === this._instance.config.capture_pageview;
			}
			startIfEnabled() {
				this.isEnabled && (Ce.info("History API monitoring enabled, starting..."), this.monitorHistoryChanges());
			}
			stop() {
				this.Ds && this.Ds(), this.Ds = void 0, Ce.info("History API monitoring stopped");
			}
			monitorHistoryChanges() {
				var e, i;
				if (t && t.history) {
					var r = this;
					null != (e = t.history.pushState) && e.__posthog_wrapped__ || Do(t.history, "pushState", ((t) => function(e, i, s) {
						t.call(this, e, i, s), r.Bs("pushState");
					})), null != (i = t.history.replaceState) && i.__posthog_wrapped__ || Do(t.history, "replaceState", ((t) => function(e, i, s) {
						t.call(this, e, i, s), r.Bs("replaceState");
					})), this.js();
				}
			}
			Bs(e) {
				try {
					var i, r = null == t || null == (i = t.location) ? void 0 : i.pathname;
					if (!r) return;
					r !== this.Ls && this.isEnabled && this._instance.capture(Ni, { navigation_type: e }), this.Ls = r;
				} catch (t) {
					Ce.error("Error capturing " + e + " pageview", t);
				}
			}
			js() {
				if (!this.Ds) {
					var e = () => {
						this.Bs("popstate");
					};
					Qi(t, "popstate", e), this.Ds = () => {
						t && t.removeEventListener("popstate", e);
					};
				}
			}
		},
		heatmaps: class {
			get Bt() {
				return this.instance.config;
			}
			constructor(t) {
				var e;
				this.$s = !1, this.Rs = !1, this.qs = null, this.instance = t, this.$s = !(null == (e = this.instance.persistence) || !e.props[ze]), this.rageclicks = new Po(t.config.rageclick);
			}
			initialize() {
				this.startIfEnabled();
			}
			get flushIntervalMilliseconds() {
				var t = 5e3;
				return O(this.Bt.capture_heatmaps) && this.Bt.capture_heatmaps.flush_interval_milliseconds && (t = this.Bt.capture_heatmaps.flush_interval_milliseconds), t;
			}
			get isEnabled() {
				return D(this.Bt.capture_heatmaps) ? D(this.Bt.enable_heatmaps) ? this.$s : this.Bt.enable_heatmaps : !1 !== this.Bt.capture_heatmaps;
			}
			startIfEnabled() {
				if (this.isEnabled) {
					if (this.Rs) return;
					Wo.info("starting..."), this.Zs(), this.Lt();
				} else {
					var t;
					clearInterval(null !== (t = this.qs) && void 0 !== t ? t : void 0), this.Hs(), this.getAndClearBuffer();
				}
			}
			onRemoteConfig(t) {
				if ("heatmaps" in t) {
					var e = !!t.heatmaps;
					this.instance.persistence && this.instance.persistence.register({ [ze]: e }), this.$s = e, this.startIfEnabled();
				}
			}
			getAndClearBuffer() {
				var t = this.T;
				return this.T = void 0, t;
			}
			Vs(t) {
				this.Tt(t.originalEvent, "deadclick");
			}
			Lt() {
				this.qs && clearInterval(this.qs), this.qs = "visible" === (null == r ? void 0 : r.visibilityState) ? setInterval(this.Yr.bind(this), this.flushIntervalMilliseconds) : null;
			}
			Zs() {
				t && r && (this.zs = this.Yr.bind(this), Qi(t, Ui, this.zs), this.Us = (e) => this.Tt(e || (null == t ? void 0 : t.event)), Qi(r, "click", this.Us, { capture: !0 }), this.Ys = (e) => this.Gs(e || (null == t ? void 0 : t.event)), Qi(r, "mousemove", this.Ys, { capture: !0 }), this.Ws = new wr(this.instance, br, this.Vs.bind(this)), this.Ws.startIfEnabledOrStop(), this.Xs = this.Lt.bind(this), Qi(r, Li, this.Xs), this.Rs = !0);
			}
			Hs() {
				var e;
				t && r && (this.zs && t.removeEventListener(Ui, this.zs), this.Us && r.removeEventListener("click", this.Us, { capture: !0 }), this.Ys && r.removeEventListener("mousemove", this.Ys, { capture: !0 }), this.Xs && r.removeEventListener(Li, this.Xs), clearTimeout(this.Js), null == (e = this.Ws) || e.stop(), this.Rs = !1);
			}
			Ks(e, i) {
				var r = this.instance.scrollManager.scrollY(), s = this.instance.scrollManager.scrollX(), n = this.instance.scrollManager.scrollElement(), o = function(e, i, r) {
					for (var s = e; s && Qn(s) && !Zn(s, "body");) {
						if (s === r) return !1;
						if (w(i, null == t ? void 0 : t.getComputedStyle(s).position)) return !0;
						s = ho(s);
					}
					return !1;
				}(ao(e), ["fixed", "sticky"], n);
				return {
					x: e.clientX + (o ? 0 : s),
					y: e.clientY + (o ? 0 : r),
					target_fixed: o,
					type: i
				};
			}
			Tt(t, e) {
				var i;
				if (void 0 === e && (e = "click"), !Xn(t.target) && Go(t)) {
					var r = this.Ks(t, e);
					null != (i = this.rageclicks) && i.isRageClick(t.clientX, t.clientY, (/* @__PURE__ */ new Date()).getTime()) && this.Qs(f({}, r, { type: "rageclick" })), this.Qs(r);
				}
			}
			Gs(t) {
				!Xn(t.target) && Go(t) && (clearTimeout(this.Js), this.Js = setTimeout((() => {
					this.Qs(this.Ks(t, "mousemove"));
				}), 500));
			}
			Qs(e) {
				if (t) {
					var i = t.location.href, r = this.Bt.custom_personal_data_properties, n = Ir(i, this.Bt.mask_personal_data_properties ? [...Fr, ...r || []] : [], Dr);
					this.T = this.T || {}, this.T[n] || (this.T[n] = []), this.T[n].push(e);
				}
			}
			Yr() {
				this.T && !I(this.T) && this.instance.capture("$$heatmap", { $heatmap_data: this.getAndClearBuffer() });
			}
		},
		deadClicksAutocapture: wr,
		webVitalsAutocapture: class {
			constructor(t) {
				var e;
				this.$s = !1, this.Rs = !1, this.T = {
					url: void 0,
					metrics: [],
					firstMetricTimestamp: void 0
				}, this.eo = () => {
					clearTimeout(this.ro), 0 !== this.T.metrics.length && (this._instance.capture("$web_vitals", this.T.metrics.reduce(((t, e) => f({}, t, {
						["$web_vitals_" + e.name + "_event"]: f({}, e),
						["$web_vitals_" + e.name + "_value"]: e.value
					})), {})), this.T = {
						url: void 0,
						metrics: [],
						firstMetricTimestamp: void 0
					});
				}, this.ht = (t) => {
					var e, i = null == (e = this._instance.sessionManager) ? void 0 : e.checkAndGetSessionAndWindowId(!0);
					if (C(i)) Uo.error("Could not read session ID. Dropping metrics!");
					else {
						this.T = this.T || {
							url: void 0,
							metrics: [],
							firstMetricTimestamp: void 0
						};
						var r = this.io();
						C(r) || (D(null == t ? void 0 : t.name) || D(null == t ? void 0 : t.value) ? Uo.error("Invalid metric received", t) : !this.no || this.no > t.value ? (this.T.url !== r && (this.eo(), this.ro = setTimeout(this.eo, this.flushToCaptureTimeoutMs)), C(this.T.url) && (this.T.url = r), this.T.firstMetricTimestamp = C(this.T.firstMetricTimestamp) ? Date.now() : this.T.firstMetricTimestamp, t.attribution && t.attribution.interactionTargetElement && (t.attribution.interactionTargetElement = void 0), this.T.metrics.push(f({}, t, {
							$current_url: r,
							$session_id: i.sessionId,
							$window_id: i.windowId,
							timestamp: Date.now()
						})), this.T.metrics.length === this.allowedMetrics.length && this.eo()) : Uo.error("Ignoring metric with value >= " + this.no, t));
					}
				}, this.so = () => {
					if (!this.Rs) {
						var t, e, i, r, s = h.__PosthogExtensions__;
						C(s) || C(s.postHogWebVitalsCallbacks) || ({onLCP: t, onCLS: e, onFCP: i, onINP: r} = s.postHogWebVitalsCallbacks), t && e && i && r ? (this.allowedMetrics.indexOf("LCP") > -1 && t(this.ht.bind(this)), this.allowedMetrics.indexOf("CLS") > -1 && e(this.ht.bind(this)), this.allowedMetrics.indexOf("FCP") > -1 && i(this.ht.bind(this)), this.allowedMetrics.indexOf("INP") > -1 && r(this.ht.bind(this)), this.Rs = !0) : Uo.error("web vitals callbacks not loaded - not starting");
					}
				}, this._instance = t, this.$s = !(null == (e = this._instance.persistence) || !e.props[Ve]), this.startIfEnabled();
			}
			get oo() {
				return this._instance.config.capture_performance;
			}
			get allowedMetrics() {
				var t, e, i = O(this.oo) ? null == (t = this.oo) ? void 0 : t.web_vitals_allowed_metrics : void 0;
				return D(i) ? (null == (e = this._instance.persistence) ? void 0 : e.props[Ye]) || [
					"CLS",
					"FCP",
					"INP",
					"LCP"
				] : i;
			}
			get flushToCaptureTimeoutMs() {
				return (O(this.oo) ? this.oo.web_vitals_delayed_flush_ms : void 0) || 5e3;
			}
			get useAttribution() {
				var t = O(this.oo) ? this.oo.web_vitals_attribution : void 0;
				return null != t && t;
			}
			get no() {
				var t = O(this.oo) && L(this.oo.__web_vitals_max_value) ? this.oo.__web_vitals_max_value : No;
				return t > 0 && 6e4 >= t ? No : t;
			}
			get isEnabled() {
				var t = null == s ? void 0 : s.protocol;
				if ("http:" !== t && "https:" !== t) return Uo.info("Web Vitals are disabled on non-http/https protocols"), !1;
				var e = O(this.oo) ? this.oo.web_vitals : N(this.oo) ? this.oo : void 0;
				return N(e) ? e : this.$s;
			}
			startIfEnabled() {
				this.isEnabled && !this.Rs && (Uo.info("enabled, starting..."), this.ur(this.so));
			}
			onRemoteConfig(t) {
				if ("capturePerformance" in t) {
					var e = O(t.capturePerformance) && !!t.capturePerformance.web_vitals, i = O(t.capturePerformance) ? t.capturePerformance.web_vitals_allowed_metrics : void 0;
					this._instance.persistence && (this._instance.persistence.register({ [Ve]: e }), this._instance.persistence.register({ [Ye]: i })), this.$s = e, this.startIfEnabled();
				}
			}
			ur(t) {
				var e, i;
				null != (e = h.__PosthogExtensions__) && e.postHogWebVitalsCallbacks ? t() : null == (i = h.__PosthogExtensions__) || null == i.loadExternalDependency || i.loadExternalDependency(this._instance, this.useAttribution ? "web-vitals-with-attribution" : "web-vitals", ((e) => {
					e ? Uo.error("failed to load script", e) : t();
				}));
			}
			io() {
				var e = t ? t.location.href : void 0;
				if (e) {
					var i = this._instance.config.custom_personal_data_properties;
					return Ir(e, this._instance.config.mask_personal_data_properties ? [...Fr, ...i || []] : [], Dr);
				}
				Uo.error("Could not determine current URL");
			}
		}
	}, wa = {
		exceptionObserver: class {
			constructor(e) {
				var i, r, s;
				this.so = () => {
					var e;
					if (t && this.isEnabled && null != (e = h.__PosthogExtensions__) && e.errorWrappingFunctions) {
						var i = h.__PosthogExtensions__.errorWrappingFunctions.wrapOnError, r = h.__PosthogExtensions__.errorWrappingFunctions.wrapUnhandledRejection, s = h.__PosthogExtensions__.errorWrappingFunctions.wrapConsoleError;
						try {
							!this.ao && this.Bt.capture_unhandled_errors && (this.ao = i(this.captureException.bind(this))), !this.lo && this.Bt.capture_unhandled_rejections && (this.lo = r(this.captureException.bind(this))), !this.uo && this.Bt.capture_console_errors && (this.uo = s(this.captureException.bind(this)));
						} catch (t) {
							Mo.error("failed to start", t), this.ho();
						}
					}
				}, this._instance = e, this.co = !(null == (i = this._instance.persistence) || !i.props[Be]), this.do = new J({
					refillRate: null !== (r = this._instance.config.error_tracking.__exceptionRateLimiterRefillRate) && void 0 !== r ? r : 1,
					bucketSize: null !== (s = this._instance.config.error_tracking.__exceptionRateLimiterBucketSize) && void 0 !== s ? s : 10,
					refillInterval: 1e4,
					Gt: Mo
				}), this.Bt = this.vo(), this.startIfEnabledOrStop();
			}
			vo() {
				var t = this._instance.config.capture_exceptions, e = {
					capture_unhandled_errors: !1,
					capture_unhandled_rejections: !1,
					capture_console_errors: !1
				};
				return O(t) ? e = f({}, e, t) : (C(t) ? this.co : t) && (e = f({}, e, {
					capture_unhandled_errors: !0,
					capture_unhandled_rejections: !0
				})), e;
			}
			get isEnabled() {
				return this.Bt.capture_console_errors || this.Bt.capture_unhandled_errors || this.Bt.capture_unhandled_rejections;
			}
			startIfEnabledOrStop() {
				this.isEnabled ? (Mo.info("enabled"), this.ho(), this.ur(this.so)) : this.ho();
			}
			ur(t) {
				var e, i;
				null != (e = h.__PosthogExtensions__) && e.errorWrappingFunctions && t(), null == (i = h.__PosthogExtensions__) || null == i.loadExternalDependency || i.loadExternalDependency(this._instance, "exception-autocapture", ((e) => {
					if (e) return Mo.error("failed to load script", e);
					t();
				}));
			}
			ho() {
				var t, e, i;
				null == (t = this.ao) || t.call(this), this.ao = void 0, null == (e = this.lo) || e.call(this), this.lo = void 0, null == (i = this.uo) || i.call(this), this.uo = void 0;
			}
			onRemoteConfig(t) {
				"autocaptureExceptions" in t && (this.co = !!t.autocaptureExceptions || !1, this._instance.persistence && this._instance.persistence.register({ [Be]: this.co }), this.Bt = this.vo(), this.startIfEnabledOrStop());
			}
			onConfigChange() {
				this.Bt = this.vo();
			}
			captureException(t) {
				var e, i, r, s = null !== (e = null == t || null == (i = t.$exception_list) || null == (i = i[0]) ? void 0 : i.type) && void 0 !== e ? e : "Exception";
				this.do.consumeRateLimit(s) ? Mo.info("Skipping exception capture because of client rate limiting.", { exception: s }) : null == (r = this._instance.exceptions) || r.sendExceptionEvent(t);
			}
		},
		exceptions: class {
			constructor(t) {
				var e, i;
				this.fo = [], this.po = new ee([
					new ce(),
					new Ee(),
					new fe(),
					new pe(),
					new we(),
					new ye(),
					new ge(),
					new xe()
				], function(t) {
					for (var e = arguments.length, i = new Array(e > 1 ? e - 1 : 0), r = 1; e > r; r++) i[r - 1] = arguments[r];
					return function(e, r) {
						void 0 === r && (r = 0);
						for (var s = [], n = e.split("\n"), o = r; n.length > o; o++) {
							var a = n[o];
							if (1024 >= a.length) {
								var l = ve.test(a) ? a.replace(ve, "$1") : a;
								if (!l.match(/\S*Error: /)) {
									for (var u of i) {
										var h = u(l, t);
										if (h) {
											s.push(h);
											break;
										}
									}
									if (s.length >= 50) break;
								}
							}
						}
						return function(t) {
							if (!t.length) return [];
							var e = Array.from(t);
							return e.reverse(), e.slice(0, 50).map(((t) => {
								return f({}, t, {
									filename: t.filename || (i = e, i[i.length - 1] || {}).filename,
									function: t.function || ie
								});
								var i;
							}));
						}(s);
					};
				}("web:javascript", le, de)), this._instance = t, this.fo = null !== (e = null == (i = this._instance.persistence) ? void 0 : i.get_property(He)) && void 0 !== e ? e : [], this.mo = Re(this.yo()), this.bo = new Pe(this.mo);
			}
			onConfigChange() {
				this.mo = Re(this.yo()), this.bo.setConfig(this.mo);
			}
			onRemoteConfig(t) {
				var e, i, r;
				if ("errorTracking" in t) {
					var s = null !== (e = null == (i = t.errorTracking) ? void 0 : i.suppressionRules) && void 0 !== e ? e : [], n = null == (r = t.errorTracking) ? void 0 : r.captureExtensionExceptions;
					this.fo = s, this._instance.persistence && this._instance.persistence.register({
						[He]: this.fo,
						[qe]: n
					});
				}
			}
			get wo() {
				var t, e = !!this._instance.get_property(qe), i = this._instance.config.error_tracking.captureExtensionExceptions;
				return null !== (t = null != i ? i : e) && void 0 !== t && t;
			}
			buildProperties(t, e) {
				return this.po.buildFromUnknown(t, {
					syntheticException: null == e ? void 0 : e.syntheticException,
					mechanism: { handled: null == e ? void 0 : e.handled }
				});
			}
			addExceptionStep(t, e) {
				if (this.mo.enabled) try {
					if (!A(t) || 0 === t.trim().length) return void va.warn("Ignoring exception step because message must be a non-empty string");
					var { sanitizedProperties: r, droppedKeys: s } = function(t) {
						if (!t) return {
							sanitizedProperties: {},
							droppedKeys: []
						};
						var e = [];
						return {
							sanitizedProperties: Object.keys(t).reduce(((i, r) => Te.has(r) ? (e.push(r), i) : (i[r] = t[r], i)), {}),
							droppedKeys: e
						};
					}(this._o(e));
					s.length > 0 && va.warn("Ignoring reserved exception step fields", { droppedKeys: s }), this.bo.add(f({
						[Se]: t,
						[$e]: (/* @__PURE__ */ new Date()).toISOString()
					}, r));
				} catch (t) {
					va.error("Failed to add exception step. Ignoring breadcrumb.", t);
				}
			}
			sendExceptionEvent(t) {
				try {
					var e = t.$exception_list;
					if (this.Io(e)) {
						if (this.Co(e)) return this.So("Exception dropped: matched a suppression rule"), void va.info("Skipping exception capture because a suppression rule matched");
						if (!this.wo && this.xo(e)) return this.So("Exception dropped: thrown by a browser extension"), void va.info("Skipping exception capture because it was thrown by an extension");
						if (!this._instance.config.error_tracking.__capturePostHogExceptions && this.ko(e)) return this.So("Exception dropped: thrown by the PostHog SDK"), void va.info("Skipping exception capture because it was thrown by the PostHog SDK");
					}
					var i = this.mo.enabled && D(t.$exception_steps) ? this.To(t) : t;
					try {
						var r = this._instance.capture("$exception", i, {
							_noTruncate: !0,
							_batchKey: "exceptionEvent",
							en: !0
						});
						return r && this.bo.clear(), r;
					} catch (t) {
						va.error("Failed to capture exception event. Dropping this exception.", t), this.bo.clear();
						return;
					}
				} catch (t) {
					va.error("Failed to process exception event. Ignoring this exception.", t);
					return;
				}
			}
			To(t) {
				try {
					var e = this.bo.getAttachable();
					return 0 === e.length ? t : f({}, t, { $exception_steps: e });
				} catch (e) {
					return va.error("Failed to read buffered exception steps. Capturing exception without steps.", e), t;
				}
			}
			So(t) {
				this.mo.enabled && this.bo.add({
					[Se]: t,
					[$e]: (/* @__PURE__ */ new Date()).toISOString()
				});
			}
			_o(t) {
				return O(t) ? f({}, t) : {};
			}
			yo() {
				var t, e;
				return null !== (t = null == (e = this._instance.config.error_tracking) ? void 0 : e.exception_steps) && void 0 !== t ? t : {};
			}
			Co(t) {
				if (0 === t.length) return !1;
				var e = t.reduce(((t, e) => {
					var { type: i, value: r } = e;
					return A(i) && i.length > 0 && t.$exception_types.push(i), A(r) && r.length > 0 && t.$exception_values.push(r), t;
				}), {
					$exception_types: [],
					$exception_values: []
				});
				return this.fo.some(((t) => {
					var i = t.values.map(((t) => {
						var i, r = gn[t.operator], s = R(t.value) ? t.value : [t.value], n = null !== (i = e[t.key]) && void 0 !== i ? i : [];
						return s.length > 0 && r(s, n);
					}));
					return "OR" === t.type ? i.some(Boolean) : i.every(Boolean);
				}));
			}
			xo(t) {
				return t.flatMap(((t) => {
					var e, i;
					return null !== (e = null == (i = t.stacktrace) ? void 0 : i.frames) && void 0 !== e ? e : [];
				})).some(((t) => t.filename && t.filename.startsWith("chrome-extension://")));
			}
			ko(t) {
				if (t.length > 0) {
					var e, i, r, s, n = null !== (e = null == (i = t[0].stacktrace) ? void 0 : i.frames) && void 0 !== e ? e : [], o = n[n.length - 1];
					return null !== (r = null == o || null == (s = o.filename) ? void 0 : s.includes("posthog.com/static")) && void 0 !== r && r;
				}
				return !1;
			}
			Io(t) {
				return !D(t) && R(t);
			}
		}
	}, xa = f({ productTours: class {
		get ni() {
			return this._instance.persistence;
		}
		constructor(t) {
			this.Ao = null, this.Eo = null, this._instance = t;
		}
		initialize() {
			this.loadIfEnabled();
		}
		onRemoteConfig(t) {
			"productTours" in t && (this.ni && this.ni.register({ [Ge]: !!t.productTours }), this.loadIfEnabled());
		}
		loadIfEnabled() {
			var t, e;
			this.Ao || (t = this._instance).config.disable_product_tours || null == (e = t.persistence) || !e.get_property(Ge) || this.ur((() => this.Ro()));
		}
		ur(t) {
			var e, i;
			null != (e = h.__PosthogExtensions__) && e.generateProductTours ? t() : null == (i = h.__PosthogExtensions__) || null == i.loadExternalDependency || i.loadExternalDependency(this._instance, "product-tours", ((e) => {
				e ? Yo.error("Could not load product tours script", e) : t();
			}));
		}
		Ro() {
			var t;
			!this.Ao && null != (t = h.__PosthogExtensions__) && t.generateProductTours && (this.Ao = h.__PosthogExtensions__.generateProductTours(this._instance, !0));
		}
		getProductTours(t, e) {
			if (void 0 === e && (e = !1), !R(this.Eo) || e) {
				var i = this.ni;
				if (i) {
					var r = i.props[pi];
					if (R(r) && !e) return this.Eo = r, void t(r, { isLoaded: !0 });
				}
				this._instance._send_request({
					url: this._instance.requestRouter.endpointFor("api", "/api/product_tours/?token=" + this._instance.config.token),
					method: "GET",
					callback: (e) => {
						var r = e.statusCode;
						if (200 !== r || !e.json) {
							var s = "Product Tours API could not be loaded, status: " + r;
							Yo.error(s), t([], {
								isLoaded: !1,
								error: s
							});
							return;
						}
						var n = R(e.json.product_tours) ? e.json.product_tours : [];
						this.Eo = n, i && i.register({ [pi]: n }), t(n, { isLoaded: !0 });
					}
				});
			} else t(this.Eo, { isLoaded: !0 });
		}
		getActiveProductTours(t) {
			D(this.Ao) ? t([], {
				isLoaded: !1,
				error: "Product tours not loaded"
			}) : this.Ao.getActiveProductTours(t);
		}
		showProductTour(t) {
			var e;
			null == (e = this.Ao) || e.showTourById(t);
		}
		previewTour(t) {
			this.Ao ? this.Ao.previewTour(t) : this.ur((() => {
				var e;
				this.Ro(), null == (e = this.Ao) || e.previewTour(t);
			}));
		}
		dismissProductTour() {
			var t;
			null == (t = this.Ao) || t.dismissTour("user_clicked_skip");
		}
		nextStep() {
			var t;
			null == (t = this.Ao) || t.nextStep();
		}
		previousStep() {
			var t;
			null == (t = this.Ao) || t.previousStep();
		}
		clearCache() {
			var t;
			this.Eo = null, null == (t = this.ni) || t.unregister(pi);
		}
		resetTour(t) {
			var e;
			null == (e = this.Ao) || e.resetTour(t);
		}
		resetAllTours() {
			var t;
			null == (t = this.Ao) || t.resetAllTours();
		}
		cancelPendingTour(t) {
			var e;
			null == (e = this.Ao) || e.cancelPendingTour(t);
		}
	} }, ma), Ea = { siteApps: class {
		constructor(t) {
			this._instance = t, this.No = [], this.apps = {};
		}
		get isEnabled() {
			return !!this._instance.config.opt_in_site_apps;
		}
		Mo(t, e) {
			if (e) {
				var i = this.globalsForEvent(e);
				this.No.push(i), this.No.length > 1e3 && (this.No = this.No.slice(10));
			}
		}
		get siteAppLoaders() {
			var t;
			return null == (t = h._POSTHOG_REMOTE_CONFIG) || null == (t = t[this._instance.config.token]) ? void 0 : t.siteApps;
		}
		initialize() {
			if (this.isEnabled) {
				var t = this._instance._addCaptureHook(this.Mo.bind(this));
				this.Fo = () => {
					t(), this.No = [], this.Fo = void 0;
				};
			}
		}
		globalsForEvent(t) {
			var e, i, r, s, n, o, a;
			if (!t) throw new Error("Event payload is required");
			var l = {}, u = this._instance.get_property("$groups") || [], h = this._instance.get_property("$stored_group_properties") || {};
			for (var [d, v] of Object.entries(h)) l[d] = {
				id: u[d],
				type: d,
				properties: v
			};
			var { $set_once: c, $set: p } = t;
			return {
				event: f({}, _(t, Jo), {
					properties: f({}, t.properties, p ? { $set: f({}, null !== (e = null == (i = t.properties) ? void 0 : i.$set) && void 0 !== e ? e : {}, p) } : {}, c ? { $set_once: f({}, null !== (r = null == (s = t.properties) ? void 0 : s.$set_once) && void 0 !== r ? r : {}, c) } : {}),
					elements_chain: null !== (n = null == (o = t.properties) ? void 0 : o.$elements_chain) && void 0 !== n ? n : "",
					distinct_id: null == (a = t.properties) ? void 0 : a.distinct_id
				}),
				person: { properties: this._instance.get_property("$stored_person_properties") },
				groups: l
			};
		}
		setupSiteApp(t) {
			var e = this.apps[t.id], i = () => {
				var i;
				!e.errored && this.No.length && (Ko.info("Processing " + this.No.length + " events for site app with id " + t.id), this.No.forEach(((t) => null == e.processEvent ? void 0 : e.processEvent(t))), e.processedBuffer = !0), Object.values(this.apps).every(((t) => t.processedBuffer || t.errored)) && (null == (i = this.Fo) || i.call(this));
			}, r = !1, s = (s) => {
				e.errored = !s, e.loaded = !0, Ko.info("Site app with id " + t.id + " " + (s ? "loaded" : "errored")), r && i();
			};
			try {
				var { processEvent: n } = t.init({
					posthog: this._instance,
					callback(t) {
						s(t);
					}
				});
				n && (e.processEvent = n), r = !0;
			} catch (e) {
				Ko.error(Xo + t.id, e), s(!1);
			}
			if (r && e.loaded) try {
				i();
			} catch (i) {
				Ko.error("Error while processing buffered events PostHog app with config id " + t.id, i), e.errored = !0;
			}
		}
		Oo() {
			var t = this.siteAppLoaders || [];
			for (var e of t) this.apps[e.id] = {
				id: e.id,
				loaded: !1,
				errored: !1,
				processedBuffer: !1
			};
			for (var i of t) this.setupSiteApp(i);
		}
		Po(t) {
			if (0 !== Object.keys(this.apps).length) {
				var e = this.globalsForEvent(t);
				for (var i of Object.values(this.apps)) try {
					null == i.processEvent || i.processEvent(e);
				} catch (e) {
					Ko.error("Error while processing event " + t.event + " for site app " + i.id, e);
				}
			}
		}
		onRemoteConfig(t) {
			var e, i, r, s = this;
			if (null != (e = this.siteAppLoaders) && e.length) return this.isEnabled ? (this.Oo(), void this._instance.on("eventCaptured", ((t) => this.Po(t)))) : void Ko.error("PostHog site apps are disabled. Enable the \"opt_in_site_apps\" config to proceed.");
			if (null == (i = this.Fo) || i.call(this), null != (r = t.siteApps) && r.length) if (this.isEnabled) {
				var n = function(t) {
					var e;
					h["__$$ph_site_app_" + t] = s._instance, null == (e = h.__PosthogExtensions__) || null == e.loadSiteApp || e.loadSiteApp(s._instance, a, ((e) => {
						if (e) return Ko.error(Xo + t, e);
					}));
				};
				for (var { id: o, url: a } of t.siteApps) n(o);
			} else Ko.error("PostHog site apps are disabled. Enable the \"opt_in_site_apps\" config to proceed.");
		}
	} }, Sa = { tracingHeaders: class {
		constructor(t) {
			this.Lo = void 0, this.Do = void 0, this.so = () => {
				var t, e, i = this.Bo() || [];
				C(this.Lo) && (null == (t = h.__PosthogExtensions__) || null == (t = t.tracingHeadersPatchFns) || t._patchXHR(i, this._instance.get_distinct_id(), this._instance.sessionManager)), C(this.Do) && (null == (e = h.__PosthogExtensions__) || null == (e = e.tracingHeadersPatchFns) || e._patchFetch(i, this._instance.get_distinct_id(), this._instance.sessionManager));
			}, this._instance = t;
		}
		initialize() {
			this.startIfEnabledOrStop();
		}
		ur(t) {
			var e, i;
			null != (e = h.__PosthogExtensions__) && e.tracingHeadersPatchFns && t(), null == (i = h.__PosthogExtensions__) || null == i.loadExternalDependency || i.loadExternalDependency(this._instance, "tracing-headers", ((e) => {
				if (e) return Lo.error("failed to load script", e);
				t();
			}));
		}
		Bo() {
			var t;
			return null !== (t = this._instance.config.addTracingHeaders) && void 0 !== t ? t : this._instance.config.__add_tracing_headers;
		}
		startIfEnabledOrStop() {
			var t, e;
			this.Bo() ? this.ur(this.so) : (null == (t = this.Lo) || t.call(this), null == (e = this.Do) || e.call(this), this.Lo = void 0, this.Do = void 0);
		}
	} }, $a = f({ surveys: class {
		get Bt() {
			return this._instance.config;
		}
		constructor(t) {
			this.jo = void 0, this._surveyManager = null, this.$o = !1, this.qo = [], this.Zo = null, this._instance = t, this._surveyEventReceiver = null;
		}
		initialize() {
			this.loadIfEnabled();
		}
		onRemoteConfig(t) {
			if (!this.Bt.disable_surveys) {
				var e = t.surveys;
				if (D(e)) return Tn.warn("Flags not loaded yet. Not loading surveys.");
				this.jo = R(e) ? e.length > 0 : e, Tn.info("flags response received, isSurveysEnabled: " + this.jo), this.loadIfEnabled();
			}
		}
		reset() {
			localStorage.removeItem("lastSeenSurveyDate");
			for (var t = [], e = 0; e < localStorage.length; e++) {
				var i = localStorage.key(e);
				(null != i && i.startsWith(kn) || null != i && i.startsWith("inProgressSurvey_")) && t.push(i);
			}
			t.forEach(((t) => localStorage.removeItem(t)));
		}
		loadIfEnabled() {
			if (!this._surveyManager) if (this.$o) Tn.info("Already initializing surveys, skipping...");
			else if (this.Bt.disable_surveys) Tn.info(ra);
			else if (this.Bt.cookieless_mode && this._instance.consent.isOptedOut()) Tn.info("Not loading surveys in cookieless mode without consent.");
			else {
				var t = null == h ? void 0 : h.__PosthogExtensions__;
				if (t) {
					if (!C(this.jo) || this.Bt.advanced_enable_surveys) {
						var e = this.jo || this.Bt.advanced_enable_surveys;
						this.$o = !0;
						try {
							var i = t.generateSurveys;
							if (i) return void this.Ho(i, e);
							var r = t.loadExternalDependency;
							if (!r) return void this.Vo(Ii);
							r(this._instance, "surveys", ((i) => {
								i || !t.generateSurveys ? this.Vo("Could not load surveys script", i) : this.Ho(t.generateSurveys, e);
							}));
						} catch (t) {
							throw this.Vo("Error initializing surveys", t), t;
						} finally {
							this.$o = !1;
						}
					}
				} else Tn.error("PostHog Extensions not found.");
			}
		}
		Ho(t, e) {
			this._surveyManager = t(this._instance, e), this._surveyEventReceiver = new ea(this._instance), Tn.info("Surveys loaded successfully"), this.zo({ isLoaded: !0 });
		}
		Vo(t, e) {
			Tn.error(t, e), this.zo({
				isLoaded: !1,
				error: t
			});
		}
		onSurveysLoaded(t) {
			return this.qo.push(t), this._surveyManager && this.zo({ isLoaded: !0 }), () => {
				this.qo = this.qo.filter(((e) => e !== t));
			};
		}
		getSurveys(t, e) {
			if (void 0 === e && (e = !1), this.Bt.disable_surveys) return Tn.info(ra), t([]);
			var i, r = this._instance.get_property(vi);
			if (r && !e) return t(r, { isLoaded: !0 });
			"undefined" != typeof Promise && this.Zo ? this.Zo.then(((e) => {
				var { surveys: i, context: r } = e;
				return t(i, r);
			})) : ("undefined" != typeof Promise && (this.Zo = new Promise(((t) => {
				i = t;
			}))), this._instance._send_request({
				url: this._instance.requestRouter.endpointFor("api", "/api/surveys/?token=" + this.Bt.token),
				method: "GET",
				timeout: this.Bt.surveys_request_timeout_ms,
				callback: (e) => {
					var r;
					this.Zo = null;
					var s = e.statusCode;
					if (200 !== s || !e.json) {
						var n = "Surveys API could not be loaded, status: " + s;
						Tn.error(n);
						var o = {
							isLoaded: !1,
							error: n
						};
						t([], o), i?.({
							surveys: [],
							context: o
						});
						return;
					}
					var a, l = e.json.surveys || [], u = l.filter(((t) => function(t) {
						return !(!t.start_date || t.end_date);
					}(t) && (function(t) {
						var e;
						return !(null == (e = t.conditions) || null == (e = e.events) || null == (e = e.values) || !e.length);
					}(t) || function(t) {
						var e;
						return !(null == (e = t.conditions) || null == (e = e.actions) || null == (e = e.values) || !e.length);
					}(t))));
					u.length > 0 && (null == (a = this._surveyEventReceiver) || a.register(u)), null == (r = this._instance.persistence) || r.register({ [vi]: l });
					var h = { isLoaded: !0 };
					t(l, h), i?.({
						surveys: l,
						context: h
					});
				}
			}));
		}
		zo(t) {
			for (var e of this.qo) try {
				if (!t.isLoaded) return e([], t);
				this.getSurveys(e);
			} catch (t) {
				Tn.error("Error in survey callback", t);
			}
		}
		getActiveMatchingSurveys(t, e) {
			if (void 0 === e && (e = !1), !D(this._surveyManager)) return this._surveyManager.getActiveMatchingSurveys(t, e);
			Tn.warn("init was not called");
		}
		Uo(t) {
			var e = null;
			return this.getSurveys(((i) => {
				var r;
				e = null !== (r = i.find(((e) => e.id === t))) && void 0 !== r ? r : null;
			})), e;
		}
		Yo(t) {
			if (D(this._surveyManager)) return {
				eligible: !1,
				reason: ia
			};
			var e = "string" == typeof t ? this.Uo(t) : t;
			return e ? this._surveyManager.checkSurveyEligibility(e) : {
				eligible: !1,
				reason: "Survey not found"
			};
		}
		canRenderSurvey(t) {
			if (D(this._surveyManager)) return Tn.warn("init was not called"), {
				visible: !1,
				disabledReason: ia
			};
			var e = this.Yo(t);
			return {
				visible: e.eligible,
				disabledReason: e.reason
			};
		}
		canRenderSurveyAsync(t, e) {
			return D(this._surveyManager) ? (Tn.warn("init was not called"), Promise.resolve({
				visible: !1,
				disabledReason: ia
			})) : new Promise(((i) => {
				this.getSurveys(((e) => {
					var r, s = null !== (r = e.find(((e) => e.id === t))) && void 0 !== r ? r : null;
					if (s) {
						var n = this.Yo(s);
						i({
							visible: n.eligible,
							disabledReason: n.reason
						});
					} else i({
						visible: !1,
						disabledReason: "Survey not found"
					});
				}), e);
			}));
		}
		renderSurvey(t, e, i) {
			var s;
			if (D(this._surveyManager)) Tn.warn("init was not called");
			else {
				var n = "string" == typeof t ? this.Uo(t) : t;
				if (null != n && n.id) if (Rn.includes(n.type)) {
					var o = null == r ? void 0 : r.querySelector(e);
					if (o) return null != (s = n.appearance) && s.surveyPopupDelaySeconds ? (Tn.info("Rendering survey " + n.id + " with delay of " + n.appearance.surveyPopupDelaySeconds + " seconds"), void setTimeout((() => {
						var t, e;
						Tn.info("Rendering survey " + n.id + " with delay of " + (null == (t = n.appearance) ? void 0 : t.surveyPopupDelaySeconds) + " seconds"), null == (e = this._surveyManager) || e.renderSurvey(n, o, i), Tn.info("Survey " + n.id + " rendered");
					}), 1e3 * n.appearance.surveyPopupDelaySeconds)) : void this._surveyManager.renderSurvey(n, o, i);
					Tn.warn("Survey element not found");
				} else Tn.warn("Surveys of type " + n.type + " cannot be rendered in the app");
				else Tn.warn("Survey not found");
			}
		}
		displaySurvey(t, e) {
			var i;
			if (D(this._surveyManager)) Tn.warn("init was not called");
			else {
				var r = this.Uo(t);
				if (r) {
					var s = r;
					if (null != (i = r.appearance) && i.surveyPopupDelaySeconds && e.ignoreDelay && (s = f({}, r, { appearance: f({}, r.appearance, { surveyPopupDelaySeconds: 0 }) })), e.displayType !== os.Popover && e.initialResponses && Tn.warn("initialResponses is only supported for popover surveys. prefill will not be applied."), !1 === e.ignoreConditions) {
						var n = this.canRenderSurvey(r);
						if (!n.visible) return void Tn.warn("Survey is not eligible to be displayed: ", n.disabledReason);
					}
					e.displayType !== os.Inline ? this._surveyManager.handlePopoverSurvey(s, e) : this.renderSurvey(s, e.selector, e.properties);
				} else Tn.warn("Survey not found");
			}
		}
		cancelPendingSurvey(t) {
			D(this._surveyManager) ? Tn.warn("init was not called") : this._surveyManager.cancelSurvey(t);
		}
		handlePageUnload() {
			var t;
			null == (t = this._surveyManager) || t.handlePageUnload();
		}
	} }, ma), Ta = { toolbar: class {
		constructor(t) {
			this.instance = t;
		}
		Go(t) {
			h.ph_toolbar_state = t;
		}
		Wo() {
			var t;
			return null !== (t = h.ph_toolbar_state) && void 0 !== t ? t : 0;
		}
		initialize() {
			return this.maybeLoadToolbar();
		}
		maybeLoadToolbar(e, i, s) {
			if (void 0 === e && (e = void 0), void 0 === i && (i = void 0), void 0 === s && (s = void 0), Zi(this.instance.config)) return !1;
			if (!t || !r) return !1;
			e = null != e ? e : t.location, s = null != s ? s : t.history;
			try {
				if (!i) {
					try {
						t.localStorage.setItem("test", "test"), t.localStorage.removeItem("test");
					} catch (t) {
						return !1;
					}
					i = null == t ? void 0 : t.localStorage;
				}
				var n, o = sa || Cr(e.hash, "__posthog") || Cr(e.hash, "state"), a = o ? Gi((() => JSON.parse(atob(decodeURIComponent(o))))) || Gi((() => JSON.parse(decodeURIComponent(o)))) : null;
				return a && "ph_authorize" === a.action ? ((n = a).source = "url", n && Object.keys(n).length > 0 && (a.desiredHash ? e.hash = a.desiredHash : s ? s.replaceState(s.state, "", e.pathname + e.search) : e.hash = "")) : ((n = JSON.parse(i.getItem(na) || "{}")).source = "localstorage", delete n.userIntent), !(!n.token || this.instance.config.token !== n.token || (this.loadToolbar(n), 0));
			} catch (t) {
				return !1;
			}
		}
		Xo(t) {
			var e = h.ph_load_toolbar || h.ph_load_editor;
			!D(e) && P(e) ? e(t, this.instance) : oa.warn("No toolbar load function found");
		}
		loadToolbar(e) {
			var i = !(null == r || !r.getElementById(Ti));
			if (!t || i) return !1;
			var s = "custom" === this.instance.requestRouter.region && this.instance.config.advanced_disable_toolbar_metrics, n = f({ token: this.instance.config.token }, e, { apiURL: this.instance.requestRouter.endpointFor("ui") }, s ? { instrument: !1 } : {});
			if (t.localStorage.setItem(na, JSON.stringify(f({}, n, { source: void 0 }))), 2 === this.Wo()) this.Xo(n);
			else if (0 === this.Wo()) {
				var o;
				this.Go(1), null == (o = h.__PosthogExtensions__) || null == o.loadExternalDependency || o.loadExternalDependency(this.instance, "toolbar", ((t) => {
					if (t) return oa.error("[Toolbar] Failed to load", t), void this.Go(0);
					this.Go(2), this.Xo(n);
				})), Qi(t, "turbolinks:load", (() => {
					this.Go(0), this.loadToolbar(n);
				}));
			}
			return !0;
		}
		Jo(t) {
			return this.loadToolbar(t);
		}
		maybeLoadEditor(t, e, i) {
			return void 0 === t && (t = void 0), void 0 === e && (e = void 0), void 0 === i && (i = void 0), this.maybeLoadToolbar(t, e, i);
		}
	} }, ka = f({ experiments: fa }, ma), Oa = f({}, ma, ba, ya, wa, xa, Ea, $a, Sa, Ta, ka, { conversations: class {
		constructor(t) {
			this.Ko = void 0, this._conversationsManager = null, this.Qo = !1, this.ea = null, this._instance = t;
		}
		initialize() {
			this.loadIfEnabled();
		}
		onRemoteConfig(t) {
			if (!this._instance.config.disable_conversations) {
				var e = t.conversations;
				D(e) || (N(e) ? this.Ko = e : (this.Ko = e.enabled, this.ea = e), this.loadIfEnabled());
			}
		}
		reset() {
			var t;
			null == (t = this._conversationsManager) || t.reset(), this._conversationsManager = null, this.Ko = void 0, this.ea = null;
		}
		loadIfEnabled() {
			if (!(this._conversationsManager || this.Qo || this._instance.config.disable_conversations || Zi(this._instance.config) || this._instance.config.cookieless_mode && this._instance.consent.isOptedOut())) {
				var t = null == h ? void 0 : h.__PosthogExtensions__;
				if (t && !C(this.Ko) && this.Ko) if (this.ea && this.ea.token) {
					this.Qo = !0;
					try {
						var e = t.initConversations;
						if (e) return this.ta(e), void (this.Qo = !1);
						var i = t.loadExternalDependency;
						if (!i) return void this.ra(Ii);
						i(this._instance, "conversations", ((e) => {
							e || !t.initConversations ? this.ra("Could not load conversations script", e) : this.ta(t.initConversations), this.Qo = !1;
						}));
					} catch (t) {
						this.ra("Error initializing conversations", t), this.Qo = !1;
					}
				} else _a.error("Conversations enabled but missing token in remote config.");
			}
		}
		ta(t) {
			if (this.ea) try {
				this._conversationsManager = t(this.ea, this._instance), _a.info("Conversations loaded successfully");
			} catch (t) {
				this.ra("Error completing conversations initialization", t);
			}
			else _a.error("Cannot complete initialization: remote config is null");
		}
		ra(t, e) {
			_a.error(t, e), this._conversationsManager = null, this.Qo = !1;
		}
		show() {
			this._conversationsManager ? this._conversationsManager.show() : _a.warn("Conversations not loaded yet.");
		}
		hide() {
			this._conversationsManager && this._conversationsManager.hide();
		}
		isAvailable() {
			return !0 === this.Ko && !M(this._conversationsManager);
		}
		isVisible() {
			var t, e;
			return null !== (t = null == (e = this._conversationsManager) ? void 0 : e.isVisible()) && void 0 !== t && t;
		}
		sendMessage(t, e, i) {
			var r = this;
			return p((function* () {
				return r._conversationsManager ? r._conversationsManager.sendMessage(t, e, i) : (_a.warn(ga), null);
			}))();
		}
		getMessages(t, e) {
			var i = this;
			return p((function* () {
				return i._conversationsManager ? i._conversationsManager.getMessages(t, e) : (_a.warn(ga), null);
			}))();
		}
		markAsRead(t) {
			var e = this;
			return p((function* () {
				return e._conversationsManager ? e._conversationsManager.markAsRead(t) : (_a.warn(ga), null);
			}))();
		}
		getTickets(t) {
			var e = this;
			return p((function* () {
				return e._conversationsManager ? e._conversationsManager.getTickets(t) : (_a.warn(ga), null);
			}))();
		}
		requestRestoreLink(t) {
			var e = this;
			return p((function* () {
				return e._conversationsManager ? e._conversationsManager.requestRestoreLink(t) : (_a.warn(ga), null);
			}))();
		}
		restoreFromToken(t) {
			var e = this;
			return p((function* () {
				return e._conversationsManager ? e._conversationsManager.restoreFromToken(t) : (_a.warn(ga), null);
			}))();
		}
		restoreFromUrlToken() {
			var t = this;
			return p((function* () {
				return t._conversationsManager ? t._conversationsManager.restoreFromUrlToken() : (_a.warn(ga), null);
			}))();
		}
		getCurrentTicketId() {
			var t, e;
			return null !== (t = null == (e = this._conversationsManager) ? void 0 : e.getCurrentTicketId()) && void 0 !== t ? t : null;
		}
		getWidgetSessionId() {
			var t, e;
			return null !== (t = null == (e = this._conversationsManager) ? void 0 : e.getWidgetSessionId()) && void 0 !== t ? t : null;
		}
		un() {
			var t;
			null == (t = this._conversationsManager) || t.setIdentity();
		}
		hn() {
			var t;
			null == (t = this._conversationsManager) || t.clearIdentity();
		}
	} }, { logs: class {
		constructor(t) {
			var e;
			this.ia = !1, this.na = !1, this.Gt = Ae("[logs]"), this.sa = [], this.oa = 0, this.aa = 0, this.la = !1, this._instance = t, this._instance && null != (e = this._instance.config.logs) && e.captureConsoleLogs && (this.ia = !0);
		}
		initialize() {
			this.loadIfEnabled();
		}
		onRemoteConfig(t) {
			var e, i = null == (e = t.logs) ? void 0 : e.captureConsoleLogs;
			!D(i) && i && (this.ia = !0, this.loadIfEnabled());
		}
		reset() {
			this.sa = [], this.jr && (clearTimeout(this.jr), this.jr = void 0), this.oa = 0, this.aa = 0, this.la = !1;
		}
		loadIfEnabled() {
			if (this.ia && !this.na) {
				var t = null == h ? void 0 : h.__PosthogExtensions__;
				if (t) {
					var e = t.loadExternalDependency;
					e ? e(this._instance, "logs", ((e) => {
						var i;
						e || null == (i = t.logs) || !i.initializeLogs ? this.Gt.error("Could not load logs script", e) : (t.logs.initializeLogs(this._instance), this.na = !0);
					})) : this.Gt.error(Ii);
				} else this.Gt.error("PostHog Extensions not found.");
			}
		}
		captureLog(t) {
			var e, i, r, s, n, o;
			if (this._instance.is_capturing()) if (t && t.body) {
				var a = null !== (e = null == (i = this._instance.config.logs) ? void 0 : i.flushIntervalMs) && void 0 !== e ? e : 3e3, l = null !== (r = null == (s = this._instance.config.logs) ? void 0 : s.maxLogsPerInterval) && void 0 !== r ? r : 1e3, u = Date.now();
				if (a > u - this.aa || (this.aa = u, this.oa = 0, this.la = !1), l > this.oa) {
					this.oa++;
					var h = function(t, e) {
						var { text: r, number: s } = Kt[t.level || "info"] || Xt, n = String(Date.now()) + "000000", o = {};
						e.distinctId && (o.posthogDistinctId = e.distinctId), e.sessionId && (o.sessionId = e.sessionId), e.currentUrl && (o["url.full"] = e.currentUrl), e.screenName && (o["screen.name"] = e.screenName), e.appState && (o["app.state"] = e.appState), e.activeFeatureFlags && e.activeFeatureFlags.length > 0 && (o.feature_flags = e.activeFeatureFlags);
						var a = f({}, o, t.attributes || {}), l = {
							timeUnixNano: n,
							observedTimeUnixNano: n,
							severityNumber: s,
							severityText: r,
							body: { stringValue: t.body },
							attributes: Zt(a)
						};
						return t.trace_id && (l.traceId = t.trace_id), t.span_id && (l.spanId = t.span_id), C(t.trace_flags) || (l.flags = t.trace_flags), l;
					}(t, this.ua());
					this.sa.push({ record: h }), (null !== (n = null == (o = this._instance.config.logs) ? void 0 : o.maxBufferSize) && void 0 !== n ? n : 100) > this.sa.length ? this.ha() : this.flushLogs();
				} else this.la || (this.Gt.warn("captureLog dropping logs: exceeded " + l + " logs per " + a + "ms"), this.la = !0);
			} else this.Gt.warn("captureLog requires a body");
		}
		get logger() {
			return this.ca || (this.ca = {
				trace: (t, e) => this.captureLog({
					body: t,
					level: "trace",
					attributes: e
				}),
				debug: (t, e) => this.captureLog({
					body: t,
					level: "debug",
					attributes: e
				}),
				info: (t, e) => this.captureLog({
					body: t,
					level: "info",
					attributes: e
				}),
				warn: (t, e) => this.captureLog({
					body: t,
					level: "warn",
					attributes: e
				}),
				error: (t, e) => this.captureLog({
					body: t,
					level: "error",
					attributes: e
				}),
				fatal: (t, e) => this.captureLog({
					body: t,
					level: "fatal",
					attributes: e
				})
			}), this.ca;
		}
		flushLogs(t) {
			if (this.jr && (clearTimeout(this.jr), this.jr = void 0), 0 !== this.sa.length) {
				var e = this.sa;
				this.sa = [];
				var i = this._instance.config.logs, r = f({ "service.name": (null == i ? void 0 : i.serviceName) || "unknown_service" }, (null == i ? void 0 : i.environment) && { "deployment.environment": i.environment }, (null == i ? void 0 : i.serviceVersion) && { "service.version": i.serviceVersion }, null == i ? void 0 : i.resourceAttributes), s = function(t, e, i, r) {
					return { resourceLogs: [{
						resource: { attributes: Zt(e) },
						scopeLogs: [{
							scope: {
								name: i,
								version: r
							},
							logRecords: t
						}]
					}] };
				}(e.map(((t) => t.record)), r, v.LIB_NAME, v.LIB_VERSION), n = this._instance.requestRouter.endpointFor("api", "/i/v1/logs") + "?token=" + encodeURIComponent(this._instance.config.token);
				this._instance.Hi({
					method: "POST",
					url: n,
					data: s,
					compression: "best-available",
					batchKey: "logs",
					transport: t
				});
			}
		}
		ha() {
			var t, e;
			this.jr || (this.jr = setTimeout((() => {
				this.jr = void 0, this.flushLogs();
			}), null !== (t = null == (e = this._instance.config.logs) ? void 0 : e.flushIntervalMs) && void 0 !== t ? t : 3e3));
		}
		ua() {
			var t, e = {};
			if (e.distinctId = this._instance.get_distinct_id(), this._instance.sessionManager) {
				var { sessionId: i } = this._instance.sessionManager.checkAndGetSessionAndWindowId(!0);
				e.sessionId = i;
			}
			if (null != h && null != (t = h.location) && t.href && (e.currentUrl = h.location.href), this._instance.featureFlags) {
				var r = this._instance.featureFlags.getFlags();
				r && r.length > 0 && (e.activeFeatureFlags = r);
			}
			return e;
		}
	} });
	Gn.__defaultExtensionClasses = f({}, Oa);
	var Ia, Ca = (Ia = Fn[zn] = new Gn(), function() {
		function e() {
			e.done || (e.done = !0, Bn = !1, qi(Fn, (function(t) {
				t._dom_loaded();
			})));
		}
		null != r && r.addEventListener ? "complete" === r.readyState ? e() : Qi(r, "DOMContentLoaded", e, { capture: !1 }) : t && Ce.error("Browser doesn't support `document.addEventListener` so PostHog couldn't be initialized");
	}(), Ia);
	//#endregion
	//#region src/lib/posthog.js
	var APP_NAME = "torn-ucm-userscript";
	var RELEASE = `${APP_NAME}@0.0.7`;
	var SENSITIVE_KEY_PATTERN = /apiKey|apikey|key|token|sessionToken|secret|authorization/i;
	var SENSITIVE_URL_PATTERN = /([?&][^=]*(?:token|key|secret)[^=]*=)[^&\s]+/gi;
	var initRequested = false;
	function redactValue(key, value) {
		if (SENSITIVE_KEY_PATTERN.test(key)) return value ? "***" : value;
		if (/url|href/i.test(key) && typeof value === "string") return value.replace(SENSITIVE_URL_PATTERN, "$1***");
		return value;
	}
	function redactObject(value) {
		if (!value || typeof value !== "object") return value;
		if (Array.isArray(value)) return value.map(redactObject);
		const redacted = {};
		for (const [key, entryValue] of Object.entries(value)) if (entryValue && typeof entryValue === "object") redacted[key] = redactObject(entryValue);
		else redacted[key] = redactValue(key, entryValue);
		return redacted;
	}
	function mapLogLevel(level) {
		if (level === "ok") return "info";
		if (level === "warn") return "warn";
		if (level === "error") return "error";
		return "info";
	}
	function callPostHog(methodName, ...args) {
		const method = Ca?.[methodName];
		if (typeof method !== "function") return;
		try {
			method.apply(Ca, args);
		} catch {}
	}
	function initPostHog() {
		if (initRequested) return;
		initRequested = true;
		Ca.init("phc_wnMwPVFMsUHMGA2BJ2rHfeYPEp24jC38DX4LA49EAYfg", {
			api_host: "https://us.i.posthog.com",
			defaults: "2026-01-30",
			capture_exceptions: {
				capture_unhandled_errors: true,
				capture_unhandled_rejections: true,
				capture_console_errors: true
			},
			logs: {
				serviceName: APP_NAME,
				environment: "production",
				serviceVersion: "0.0.7",
				maxLogsPerInterval: 500
			},
			before_send(event) {
				if (event?.properties) event.properties = redactObject(event.properties);
				return event;
			},
			loaded(posthog) {
				try {
					posthog.register({
						app: APP_NAME,
						app_version: "0.0.7",
						release: RELEASE,
						runtime: "userscript"
					});
					posthog.capture("ucm_posthog_loaded", {
						release: RELEASE,
						href: typeof window !== "undefined" ? window.location.href : ""
					});
				} catch {}
			}
		});
	}
	initPostHog();
	function captureDiagnostic(entry) {
		const attributes = redactObject({
			level: entry.level,
			area: entry.area,
			details: entry.details,
			ts: entry.ts,
			release: RELEASE
		});
		callPostHog("captureLog", {
			body: `[${entry.area}] ${entry.message}`,
			level: mapLogLevel(entry.level),
			attributes
		});
		callPostHog("capture", "ucm_diagnostic", {
			...attributes,
			message: entry.message
		});
	}
	function captureUcmException(error, context = {}) {
		const properties = redactObject({
			source: "ucm",
			release: RELEASE,
			...context.tags || {},
			...context.extra || {}
		});
		callPostHog("captureException", error, properties);
		callPostHog("captureLog", {
			body: error?.message || "unknown error",
			level: "error",
			attributes: properties
		});
		callPostHog("capture", "ucm_exception", {
			message: error?.message || "unknown error",
			...properties
		});
	}
	function updatePostHogUserContext({ memberId, factionId, permissionCount } = {}) {
		if (memberId) callPostHog("identify", String(memberId), {
			faction_id: factionId ? String(factionId) : null,
			permission_count: Number(permissionCount || 0)
		});
		callPostHog("register", {
			faction_id: factionId ? String(factionId) : "none",
			permission_count: Number(permissionCount || 0),
			has_member: Boolean(memberId),
			has_faction: Boolean(factionId)
		});
	}
	//#endregion
	//#region src/lib/storage.js
	function getCookie(name) {
		try {
			const encoded = encodeURIComponent(name) + "=";
			const cookies = document.cookie ? document.cookie.split("; ") : [];
			for (const cookie of cookies) if (cookie.startsWith(encoded)) return decodeURIComponent(cookie.slice(encoded.length));
		} catch {}
		return null;
	}
	function setCookie(name, value) {
		try {
			document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; path=/; max-age=${3600 * 24 * 365}; SameSite=Lax`;
			return true;
		} catch {
			return false;
		}
	}
	function storageGet(key) {
		try {
			const value = window.localStorage.getItem(key);
			if (value !== null) return value;
		} catch {}
		return getCookie(key);
	}
	function storageSet(key, value) {
		try {
			window.localStorage.setItem(key, value);
			return true;
		} catch {
			return setCookie(key, value);
		}
	}
	function storageRemove(key) {
		try {
			window.localStorage.removeItem(key);
		} catch {}
		try {
			document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
		} catch {}
	}
	//#endregion
	//#region src/config.js
	function resolveBackendURL() {
		const override = storageGet("ucm_backend_url");
		if (override) return override;
		return "https://ucm.neelyinno.com";
	}
	/**
	* UCM Userscript Configuration
	*/
	var CONFIG = {
		BACKEND_URL: resolveBackendURL(),
		PASS_DEFAULT_TTL_SECONDS: 45,
		MUTATION_OBSERVER_DEBOUNCE_MS: 100,
		SELECTORS: {
			CSS: "#react-root > div > div.playersModelWrap___dkqHO > div > div:nth-child(2) > div.playerArea___AEVBU > div.playerWindow___aDeDI > div.modal___lMj6N.defender___niX1M > div > div > div > button",
			XPATH: "/html/body/div[6]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[3]/div[2]/div[2]/div/div/div/button"
		},
		STORAGE: {
			SESSION_TOKEN: "ucm_session_token",
			MEMBER_ID: "ucm_member_id",
			FACTION_ID: "ucm_faction_id",
			EVENT_CURSOR: "ucm_event_cursor",
			PERMISSIONS: "ucm_permissions"
		}
	};
	//#endregion
	//#region src/state/store.js
	/**
	* UCM local state store.
	* Single source of truth for the userscript's view of the world.
	*/
	var state = {
		sessionToken: null,
		memberId: null,
		factionId: null,
		permissions: [],
		members: [],
		currentChain: null,
		currentChainId: null,
		commandMode: "free",
		myActivePass: null,
		myAssignment: null,
		bonusLockAssigneeMemberId: null,
		eventCursor: 0,
		rsvps: {}
	};
	function saveSession(sessionToken, memberId, factionId, permissions = []) {
		state.sessionToken = sessionToken;
		state.memberId = memberId;
		state.factionId = factionId;
		state.permissions = permissions;
	}
	/**
	* Determine if the current member's attack button should be blocked.
	*/
	function isBlocked() {
		if (state.commandMode === "free" || state.commandMode === "controlled") return false;
		const hasExempt = state.permissions.includes("attack.block.exempt");
		if (state.commandMode === "hold_all") {
			if (hasExempt) return false;
			if (state.myActivePass) return false;
			return true;
		}
		if (state.commandMode === "bonus_lock") {
			if (hasExempt) return false;
			if (state.bonusLockAssigneeMemberId === state.memberId) return false;
			if (state.myActivePass) return false;
			return true;
		}
		return false;
	}
	/**
	* Get the reason string for the current block.
	*/
	function getBlockReason() {
		if (state.commandMode === "hold_all") return "Hold active";
		if (state.commandMode === "bonus_lock") return `Bonus hit reserved`;
		return "Blocked by Ultimate Chain Manager";
	}
	//#endregion
	//#region src/lib/diagnostics.js
	var MAX_ENTRIES = 150;
	var SENSITIVE_QUERY_KEYS = new Set([
		"apiKey",
		"apikey",
		"key",
		"token",
		"sessionToken",
		"access_token"
	]);
	var entries = [];
	var listeners = /* @__PURE__ */ new Set();
	var lastTransport = "unknown";
	var sseStatus = "idle";
	function getConsoleMethod(level) {
		if (level === "error") return "error";
		if (level === "warn") return "warn";
		return "log";
	}
	function notify() {
		for (const listener of listeners) try {
			listener(entries);
		} catch {}
	}
	function safeString(value) {
		if (value == null) return "";
		if (typeof value === "string") return value;
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}
	function formatConsoleDetails(details) {
		if (details === void 0) return "";
		const text = safeString(details);
		return text ? ` ${text}` : "";
	}
	function redactUrl(value) {
		if (!value) return "";
		try {
			const url = new URL(String(value), window.location.href);
			for (const key of Array.from(url.searchParams.keys())) if (SENSITIVE_QUERY_KEYS.has(key) || /token|key|secret/i.test(key)) url.searchParams.set(key, "***");
			const query = url.searchParams.toString();
			return `${url.host}${url.pathname}${query ? `?${query}` : ""}`;
		} catch {
			return String(value).replace(/([?&][^=]*(?:token|key|secret)[^=]*=)[^&\s]+/gi, "$1***");
		}
	}
	function redactDetails(details = {}) {
		const redacted = {};
		for (const [key, value] of Object.entries(details || {})) if (/^(apiKey|apikey|key|token|sessionToken|secret|authorization)$/i.test(key)) redacted[key] = value ? "***" : value;
		else if (/url/i.test(key)) redacted[key] = redactUrl(value);
		else redacted[key] = value;
		return redacted;
	}
	function logDiagnostic(level, area, message, details = void 0) {
		const normalizedLevel = [
			"ok",
			"info",
			"warn",
			"error"
		].includes(level) ? level : "info";
		const entry = {
			id: Date.now() + Math.random(),
			ts: (/* @__PURE__ */ new Date()).toISOString(),
			level: normalizedLevel,
			area: area || "app",
			message: message || "",
			details: details === void 0 ? void 0 : redactDetails(details)
		};
		entries.push(entry);
		if (entries.length > MAX_ENTRIES) entries.shift();
		const consoleMethod = getConsoleMethod(normalizedLevel);
		console[consoleMethod](`[UCM][${entry.area}] ${entry.message}${formatConsoleDetails(entry.details)}`);
		captureDiagnostic(entry);
		if (normalizedLevel === "error") captureUcmException(/* @__PURE__ */ new Error(`[${entry.area}] ${entry.message}`), {
			tags: { area: entry.area },
			extra: { details: entry.details }
		});
		notify();
		return entry;
	}
	function setLastTransport(transport) {
		lastTransport = transport || "unknown";
	}
	function setSseStatus(status, details = void 0) {
		sseStatus = status || "unknown";
		logDiagnostic(status === "error" ? "error" : "info", "sse", `SSE ${sseStatus}`, details);
	}
	function getDiagnosticsEntries() {
		return [...entries];
	}
	function clearDiagnostics() {
		entries.length = 0;
		notify();
	}
	function getPlatformInfo() {
		const hasPdaGet = typeof PDA_httpGet === "function";
		const hasPdaPost = typeof PDA_httpPost === "function";
		const hasGmXmlHttpRequest = typeof GM_xmlhttpRequest === "function";
		const hasGmNamespaceRequest = typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function";
		const scriptVersion = typeof GM_info !== "undefined" && GM_info?.script?.version || "unknown";
		return {
			platform: hasPdaGet || hasPdaPost ? "TornPDA" : "Userscript manager",
			backendUrl: CONFIG.BACKEND_URL,
			scriptVersion,
			href: typeof window !== "undefined" ? window.location.href : "",
			readyState: typeof document !== "undefined" ? document.readyState : "",
			isTopWindow: typeof window !== "undefined" ? window.top === window.self : true,
			hasPdaGet,
			hasPdaPost,
			hasGmXmlHttpRequest,
			hasGmNamespaceRequest,
			hasFetch: typeof fetch === "function",
			lastTransport,
			sseStatus,
			hasSessionToken: Boolean(state.sessionToken),
			sessionTokenLength: state.sessionToken?.length || 0,
			memberId: state.memberId || null,
			factionId: state.factionId || null,
			permissionCount: Array.isArray(state.permissions) ? state.permissions.length : 0,
			currentChainId: state.currentChainId || null,
			commandMode: state.commandMode || null
		};
	}
	function serializeDiagnostics() {
		const platform = getPlatformInfo();
		const lines = [
			"UCM diagnostics",
			`Generated: ${(/* @__PURE__ */ new Date()).toISOString()}`,
			`Platform: ${platform.platform}`,
			`Backend: ${redactUrl(platform.backendUrl)}`,
			`Script version: ${platform.scriptVersion}`,
			`Transport: ${platform.lastTransport}`,
			`SSE: ${platform.sseStatus}`,
			`Session: ${platform.hasSessionToken ? `present (${platform.sessionTokenLength})` : "missing"}`,
			`Member: ${platform.memberId || "-"}`,
			`Faction: ${platform.factionId || "-"}`,
			"",
			"Recent entries:"
		];
		for (const entry of entries) {
			const details = entry.details === void 0 ? "" : ` ${safeString(entry.details)}`;
			lines.push(`${entry.ts} ${entry.level.toUpperCase()} [${entry.area}] ${entry.message}${details}`);
		}
		return lines.join("\n");
	}
	if (typeof window !== "undefined") window.__UCM_DIAGNOSTICS__ = {
		clear: clearDiagnostics,
		entries: getDiagnosticsEntries,
		info: getPlatformInfo,
		text: serializeDiagnostics
	};
	//#endregion
	//#region src/lib/transport.js
	function getGmRequest() {
		if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
		if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest.bind(GM);
		return null;
	}
	function getPdaTransport(method) {
		const normalized = String(method || "GET").toUpperCase();
		if (normalized === "GET" && typeof PDA_httpGet === "function") return PDA_httpGet;
		if (normalized === "POST" && typeof PDA_httpPost === "function") return PDA_httpPost;
		return null;
	}
	function responseTextFrom(value) {
		if (typeof value?.responseText === "string") return value.responseText;
		if (typeof value?.body === "string") return value.body;
		if (typeof value?.data === "string") return value.data;
		if (typeof value === "string") return value;
		return "";
	}
	function responseHeadersFrom(value) {
		if (typeof value?.responseHeaders === "string") return value.responseHeaders;
		if (typeof value?.headers === "string") return value.headers;
		if (value?.headers && typeof value.headers.forEach === "function") {
			const rows = [];
			value.headers.forEach((headerValue, headerName) => {
				rows.push(`${headerName}: ${headerValue}`);
			});
			return rows.join("\r\n");
		}
		return "";
	}
	function normalizeResponse(response, transport) {
		if (!response) throw new Error(`${transport} returned an empty response.`);
		const status = Number(response?.status || 0);
		return {
			ok: status >= 200 && status < 300,
			status,
			responseText: responseTextFrom(response),
			responseHeaders: responseHeadersFrom(response),
			transport
		};
	}
	function requestViaPda(method, url, opts) {
		const pdaTransport = getPdaTransport(method);
		if (!pdaTransport) return null;
		if (String(method || "GET").toUpperCase() === "GET") return pdaTransport(url).then((response) => normalizeResponse(response, "pda"));
		return pdaTransport(url, opts.headers || {}, opts.body || "").then((response) => normalizeResponse(response, "pda"));
	}
	function requestViaGm(method, url, opts) {
		const gmRequest = getGmRequest();
		if (!gmRequest) return null;
		return new Promise((resolve, reject) => {
			gmRequest({
				method,
				url,
				headers: opts.headers,
				data: opts.body,
				responseType: "text",
				onload: (response) => {
					resolve(normalizeResponse(response, "gm"));
				},
				onerror: () => {
					reject(/* @__PURE__ */ new Error("Userscript network request failed."));
				},
				ontimeout: () => {
					reject(/* @__PURE__ */ new Error("Userscript network request timed out."));
				}
			});
		});
	}
	async function requestViaFetch(method, url, opts) {
		const response = await fetch(url, opts);
		const responseText = response.status === 204 ? "" : await response.text();
		return normalizeResponse({
			status: response.status,
			responseText,
			headers: response.headers
		}, "fetch");
	}
	function getTransportCapabilities(method = "GET") {
		return {
			hasPdaTransport: Boolean(getPdaTransport(method)),
			hasGmTransport: Boolean(getGmRequest()),
			hasFetch: typeof fetch === "function"
		};
	}
	async function httpRequest(method, url, opts = {}) {
		const normalizedMethod = String(method || "GET").toUpperCase();
		const started = performance.now();
		const redactedUrl = redactUrl(url);
		const attempts = [];
		logDiagnostic("info", "api", `${normalizedMethod} ${redactedUrl} start`, {
			hasPdaTransport: Boolean(getPdaTransport(normalizedMethod)),
			hasGmTransport: Boolean(getGmRequest()),
			hasFetch: typeof fetch === "function"
		});
		const runAttempt = async (name, requestFn) => {
			attempts.push(name);
			try {
				const response = await requestFn();
				setLastTransport(response.transport);
				const ms = Math.round(performance.now() - started);
				logDiagnostic(response.ok ? "ok" : "warn", "api", `${normalizedMethod} ${redactedUrl} -> ${response.status || "ERR"}`, {
					transport: response.transport,
					ms
				});
				return response;
			} catch (error) {
				const ms = Math.round(performance.now() - started);
				logDiagnostic("warn", "api", `${normalizedMethod} ${redactedUrl} ${name} failed`, {
					transport: name,
					ms,
					message: error?.message || "unknown error"
				});
				throw error;
			}
		};
		if (getPdaTransport(normalizedMethod)) return runAttempt("pda", () => requestViaPda(normalizedMethod, url, opts));
		if (getGmRequest()) return runAttempt("gm", () => requestViaGm(normalizedMethod, url, opts));
		if (typeof fetch === "function") return runAttempt("fetch", () => requestViaFetch(normalizedMethod, url, opts));
		logDiagnostic("error", "api", `${normalizedMethod} ${redactedUrl} no transport available`, { attempts });
		throw new Error("No compatible network transport is available.");
	}
	function getStreamingUserscriptRequest() {
		return getGmRequest();
	}
	//#endregion
	//#region src/api/client.js
	var REFRESH_SESSION_PATH = "/auth/refresh-session";
	var refreshSessionPromise = null;
	var ApiError = class extends Error {
		constructor(message, status, data = null) {
			super(message);
			this.name = "ApiError";
			this.status = status;
			this.data = data;
		}
	};
	function parseBody(contentType, text) {
		if (!text) return null;
		if (contentType.includes("application/json")) try {
			return JSON.parse(text);
		} catch {
			return null;
		}
		try {
			return JSON.parse(text);
		} catch {
			return { error: text };
		}
	}
	function parseTransportResponse(response) {
		const contentType = (response.responseHeaders?.match(/^content-type:\s*([^\r\n]+)/im))?.[1] || "";
		if (response.status === 204) return null;
		return parseBody(contentType, response.responseText || "");
	}
	function appendQueryToken(url) {
		if (!state.sessionToken) return url;
		try {
			const nextUrl = new URL(url);
			if (!nextUrl.searchParams.has("token")) nextUrl.searchParams.set("token", state.sessionToken);
			return nextUrl.toString();
		} catch {
			return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(state.sessionToken)}`;
		}
	}
	/**
	* Make an authenticated request to the UCM backend.
	*/
	async function requestOnce(method, path, body = null) {
		let url = `${CONFIG.BACKEND_URL}${path}`;
		const isOnboardRequest = path === "/auth/onboard-member";
		const opts = {
			method,
			headers: { "Content-Type": "application/json" }
		};
		if (state.sessionToken) opts.headers.Authorization = `Bearer ${state.sessionToken}`;
		const capabilities = getTransportCapabilities(method);
		let usesQueryToken = false;
		if (method === "GET" && state.sessionToken && capabilities.hasPdaTransport) {
			url = appendQueryToken(url);
			usesQueryToken = true;
		}
		if (body) opts.body = JSON.stringify(body);
		if (isOnboardRequest) logDiagnostic("info", "onboarding", "onboarding request start", {
			method,
			url,
			...capabilities,
			usesQueryToken,
			timezone: body?.timezone,
			scriptVersion: body?.scriptVersion,
			apiKeyLength: body?.apiKey?.length || 0
		});
		let response;
		try {
			response = await httpRequest(method, url, opts);
		} catch (err) {
			if (isOnboardRequest) logDiagnostic("error", "onboarding", "onboarding request failed", { message: err?.message || "unknown error" });
			throw new Error(`Network request failed: ${err?.message || "unknown error"}`);
		}
		const data = parseTransportResponse(response);
		if (isOnboardRequest) logDiagnostic(response.ok ? "ok" : "warn", "onboarding", "onboarding request completed", {
			status: response.status,
			ok: response.ok,
			transport: response.transport,
			hasSessionToken: Boolean(data?.sessionToken)
		});
		if (!response.ok) throw new ApiError(data?.error || data?.message || `Request failed: ${response.status}`, response.status, data);
		return data;
	}
	function persistSession$1(data) {
		state.sessionToken = data.sessionToken;
		state.memberId = data.member?.id || "";
		state.factionId = data.faction?.id || "";
		state.permissions = data.permissions || [];
		storageSet(CONFIG.STORAGE.SESSION_TOKEN, data.sessionToken);
		storageSet(CONFIG.STORAGE.MEMBER_ID, state.memberId);
		storageSet(CONFIG.STORAGE.FACTION_ID, state.factionId);
		storageSet(CONFIG.STORAGE.PERMISSIONS, JSON.stringify(state.permissions));
	}
	function clearSession() {
		state.sessionToken = null;
		state.memberId = null;
		state.factionId = null;
		state.permissions = [];
		storageRemove(CONFIG.STORAGE.SESSION_TOKEN);
		storageRemove(CONFIG.STORAGE.MEMBER_ID);
		storageRemove(CONFIG.STORAGE.FACTION_ID);
		storageRemove(CONFIG.STORAGE.PERMISSIONS);
	}
	function canRefreshSession(path) {
		return Boolean(state.sessionToken) && path !== "/auth/onboard-member" && path !== REFRESH_SESSION_PATH;
	}
	async function refreshSession() {
		if (!refreshSessionPromise) refreshSessionPromise = (async () => {
			const data = await requestOnce("POST", REFRESH_SESSION_PATH);
			if (!data?.sessionToken) throw new Error("Session refresh failed: missing session token.");
			persistSession$1(data);
			logDiagnostic("ok", "api", "session refreshed", {
				memberId: state.memberId || null,
				factionId: state.factionId || null,
				permissionCount: state.permissions.length
			});
			return data;
		})().catch((error) => {
			clearSession();
			throw error;
		}).finally(() => {
			refreshSessionPromise = null;
		});
		return refreshSessionPromise;
	}
	async function request(method, path, body = null, hasRetried = false) {
		try {
			return await requestOnce(method, path, body);
		} catch (error) {
			if (!hasRetried && error?.status === 401 && canRefreshSession(path)) {
				logDiagnostic("warn", "api", "request unauthorized; refreshing session", { path });
				await refreshSession();
				return request(method, path, body, true);
			}
			throw error;
		}
	}
	async function onboard(apiKey, timezone, scriptVersion) {
		return request("POST", "/auth/onboard-member", {
			apiKey,
			timezone,
			clientHost: "tornpda",
			scriptVersion
		});
	}
	/**
	* Normalize chain response fields from .NET backend (camelCase) to the
	* property names the UI templates expect.
	*/
	function normalizeChain(raw) {
		if (!raw) return null;
		return {
			...raw,
			status: raw.chainStatus ?? raw.status,
			commandMode: raw.commandMode
		};
	}
	async function getCurrentChain() {
		const data = await request("GET", "/chains/current");
		return { chain: normalizeChain(data?.chain ?? data) };
	}
	async function listChains() {
		const data = await request("GET", "/chains");
		return { chains: (Array.isArray(data) ? data : []).map(normalizeChain) };
	}
	async function getChain(chainId) {
		return { chain: normalizeChain(await request("GET", `/chains/${chainId}`)) };
	}
	async function createChain(payload) {
		return { chain: normalizeChain(await request("POST", "/chains", payload)) };
	}
	async function rsvp(chainId, payload) {
		return request("POST", `/chains/${chainId}/rsvp`, payload);
	}
	async function holdAll(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/hold-all`, payload);
	}
	async function releaseAll(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/release-all`, payload);
	}
	async function assignTarget(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/assign-target`, payload);
	}
	async function issuePass(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/issue-one-time-pass`, payload);
	}
	async function addWatchlistEntry(chainId, payload) {
		return request("POST", `/chains/${chainId}/watchlist`, payload);
	}
	async function listMembers(chainId = "") {
		return request("GET", `/members${chainId ? `?chainId=${encodeURIComponent(chainId)}` : ""}`);
	}
	async function startChain(chainId) {
		return request("POST", `/chains/${chainId}/start`, {});
	}
	async function endChain(chainId, payload) {
		return request("POST", `/chains/${chainId}/end`, payload);
	}
	//#endregion
	//#region src/ui/onboarding.js
	var MODAL_ID = "ucm-onboarding-modal";
	var EMPTY_SESSION_VALUES = new Set([
		"",
		"undefined",
		"null"
	]);
	var routeWatcherInstalled = false;
	var onboardingDismissed = false;
	function normalizeSessionToken(value) {
		if (value == null) return null;
		const normalized = String(value).trim();
		if (EMPTY_SESSION_VALUES.has(normalized.toLowerCase())) return null;
		return normalized || null;
	}
	function hasValidSessionToken(value) {
		return Boolean(normalizeSessionToken(value));
	}
	function isOnboardingEligibleRoute(locationHref = "") {
		try {
			const { hostname } = new URL(locationHref);
			return hostname === "www.torn.com";
		} catch {
			return false;
		}
	}
	function logOnboarding(message, details = void 0, level = "log") {
		logDiagnostic(level === "error" ? "error" : level === "warn" ? "warn" : "info", "onboarding", message, details);
	}
	function isOnboardingRoute() {
		return isOnboardingEligibleRoute(window.location.href);
	}
	function createModalMarkup() {
		return `
    <div class="ucm-onboarding-backdrop">
      <div class="ucm-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="ucm-onboarding-title">
        <h2 id="ucm-onboarding-title">Ultimate Chain Manager</h2>
        <p class="ucm-onboarding-subtitle">Connect your Torn account to enable chain controls in TornPDA.</p>
        <p>Please use the following link to generate a Torn API key with the required permissions: <a href="https://www.torn.com/preferences.php#tab=api?step=addNewKey&user=faction,personalstats,profile,bars,cooldowns,inventory,refills,revives,revivesfull,travel,attacks&title=Ultimate Chain Manager" target="_blank" rel="noopener">link</a></p>

        <form id="ucm-onboarding-form" class="ucm-onboarding-form u-flex u-flex-col u-gap-ucm-2">
          <label for="ucm-api-key">Torn API Key</label>
          <input
            id="ucm-api-key"
            type="password"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Paste your API key"
            required
          />

          <button id="ucm-onboarding-submit" type="submit">Connect</button>
          <button id="ucm-onboarding-dismiss" class="ucm-secondary-button" type="button">Not now</button>
          <button id="ucm-onboarding-copy-diagnostics" class="ucm-secondary-button" type="button">Copy Diagnostics</button>
          <p id="ucm-onboarding-status" class="ucm-onboarding-status" aria-live="polite"></p>
        </form>
      </div>
    </div>
  `;
	}
	function mountModal() {
		if (!document.body) {
			logOnboarding("mountModal skipped: document.body not ready yet");
			return null;
		}
		const existing = document.getElementById(MODAL_ID);
		if (existing) {
			logOnboarding("mountModal reused existing modal root");
			return existing;
		}
		const root = document.createElement("div");
		root.id = MODAL_ID;
		root.innerHTML = createModalMarkup();
		document.body.appendChild(root);
		logOnboarding("mountModal created and appended modal root");
		return root;
	}
	function setStatus(text, kind = "info") {
		const statusEl = document.getElementById("ucm-onboarding-status");
		if (!statusEl) return;
		statusEl.textContent = text;
		statusEl.dataset.kind = kind;
	}
	function setPending(isPending) {
		const button = document.getElementById("ucm-onboarding-submit");
		const input = document.getElementById("ucm-api-key");
		if (button) {
			button.disabled = isPending;
			button.textContent = isPending ? "Connecting..." : "Connect";
		}
		if (input) input.disabled = isPending;
	}
	function dismissOnboardingModal() {
		onboardingDismissed = true;
		document.getElementById(MODAL_ID)?.remove();
		logOnboarding("modal dismissed by user");
	}
	function persistSession(data) {
		saveSession(data.sessionToken, data.member?.id, data.faction?.id, data.permissions || []);
		const okToken = storageSet(CONFIG.STORAGE.SESSION_TOKEN, data.sessionToken);
		const okMember = storageSet(CONFIG.STORAGE.MEMBER_ID, data.member?.id || "");
		const okFaction = storageSet(CONFIG.STORAGE.FACTION_ID, data.faction?.id || "");
		const okPerms = storageSet(CONFIG.STORAGE.PERMISSIONS, JSON.stringify(data.permissions || []));
		const tokenAfterWrite = storageGet(CONFIG.STORAGE.SESSION_TOKEN);
		const persisted = okToken && okMember && okFaction && okPerms;
		logOnboarding("persistSession write result", {
			persisted,
			okToken,
			okMember,
			okFaction,
			okPerms,
			tokenReadableAfterWrite: Boolean(tokenAfterWrite),
			tokenLength: tokenAfterWrite?.length || 0,
			memberId: data.member?.id || null,
			factionId: data.faction?.id || null,
			permissionCount: Array.isArray(data.permissions) ? data.permissions.length : 0
		});
		return persisted;
	}
	async function submitOnboarding(apiKey) {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
		const scriptVersion = typeof GM_info !== "undefined" && GM_info?.script?.version || "0.1.0";
		logOnboarding("submitOnboarding request start", {
			backendUrl: CONFIG.BACKEND_URL,
			timezone,
			scriptVersion,
			apiKeyLength: apiKey.length
		});
		const response = await onboard(apiKey, timezone, scriptVersion);
		logOnboarding("submitOnboarding request success", {
			hasSessionToken: Boolean(response?.sessionToken),
			memberId: response?.member?.id || null,
			factionId: response?.faction?.id || null,
			permissionCount: Array.isArray(response?.permissions) ? response.permissions.length : 0
		});
		return response;
	}
	function bindFormIfNeeded() {
		const form = document.getElementById("ucm-onboarding-form");
		const apiKeyInput = document.getElementById("ucm-api-key");
		const dismissButton = document.getElementById("ucm-onboarding-dismiss");
		const copyDiagnosticsButton = document.getElementById("ucm-onboarding-copy-diagnostics");
		if (!form || !apiKeyInput) {
			logOnboarding("bindFormIfNeeded skipped: missing form or API key input", {
				hasForm: Boolean(form),
				hasInput: Boolean(apiKeyInput)
			});
			return;
		}
		if (form.dataset.ucmBound === "1") {
			logOnboarding("bindFormIfNeeded reused existing submit binding");
			apiKeyInput.focus();
			return;
		}
		form.dataset.ucmBound = "1";
		apiKeyInput.focus();
		logOnboarding("bindFormIfNeeded attached submit listener");
		dismissButton?.addEventListener("click", dismissOnboardingModal);
		copyDiagnosticsButton?.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(serializeDiagnostics());
				logOnboarding("diagnostics copied");
				setStatus("Diagnostics copied.", "success");
			} catch (err) {
				logOnboarding("diagnostics copy failed", { message: err?.message || "unknown error" }, "warn");
				setStatus("Unable to copy diagnostics. Use console __UCM_DIAGNOSTICS__.text().", "error");
			}
		});
		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			const apiKey = apiKeyInput.value.trim();
			if (!apiKey) {
				logOnboarding("submit blocked: empty API key");
				setStatus("Please enter your Torn API key.", "error");
				return;
			}
			logOnboarding("submit started", {
				apiKeyLength: apiKey.length,
				href: window.location.href,
				readyState: document.readyState
			});
			setPending(true);
			setStatus("Connecting to UCM…");
			try {
				const response = await submitOnboarding(apiKey);
				if (!response?.sessionToken) throw new Error("Onboarding failed: missing session token.");
				if (!persistSession(response)) {
					logOnboarding("submit finished with storage persistence failure", { href: window.location.href }, "warn");
					setStatus("Connected, but storage is blocked in this context. Open this page in the main TornPDA view and try again.", "error");
					setPending(false);
					return;
				}
				logOnboarding("submit completed successfully; reloading page");
				setStatus("Connected. Reloading…", "success");
				setTimeout(() => {
					window.location.reload();
				}, 600);
			} catch (err) {
				logOnboarding("submit failed", {
					message: err?.message || "unknown error",
					stack: err?.stack || null
				}, "error");
				setStatus(err?.message || "Onboarding failed. Please try again.", "error");
				setPending(false);
			}
		});
	}
	function showOnboardingModalForTornPda() {
		const routeEligible = isOnboardingRoute();
		const rawSessionToken = storageGet(CONFIG.STORAGE.SESSION_TOKEN);
		const hasSession = hasValidSessionToken(rawSessionToken);
		logOnboarding("eligibility check", {
			href: window.location.href,
			routeEligible,
			hasSessionToken: hasSession,
			sessionTokenLength: rawSessionToken?.length || 0,
			isTopWindow: window.top === window.self,
			readyState: document.readyState
		});
		if (hasSession) return false;
		if (!routeEligible) return false;
		if (onboardingDismissed) {
			logOnboarding("modal skipped: dismissed for current page load");
			return false;
		}
		const modalRoot = mountModal();
		logOnboarding("modal mount result", {
			mounted: Boolean(modalRoot),
			bodyReady: Boolean(document.body)
		});
		if (!modalRoot) return false;
		bindFormIfNeeded();
		return true;
	}
	function initOnboardingRouteWatcherForTornPda() {
		if (routeWatcherInstalled) {
			logOnboarding("route watcher already installed; skipping duplicate init");
			return;
		}
		routeWatcherInstalled = true;
		logOnboarding("installing route watcher");
		const tryShow = (reason = "manual") => {
			logOnboarding("route watcher trigger", {
				reason,
				href: window.location.href
			});
			showOnboardingModalForTornPda();
		};
		tryShow("initial");
		setTimeout(() => tryShow("retry-250ms"), 250);
		setTimeout(() => tryShow("retry-1000ms"), 1e3);
		setTimeout(() => tryShow("retry-2500ms"), 2500);
		window.addEventListener("hashchange", () => tryShow("hashchange"));
		window.addEventListener("popstate", () => tryShow("popstate"));
		const wrapHistory = (methodName) => {
			const original = history[methodName];
			if (typeof original !== "function") return;
			history[methodName] = function wrappedHistoryState(...args) {
				const result = original.apply(this, args);
				setTimeout(() => tryShow(`history.${methodName}`), 0);
				return result;
			};
			logOnboarding("wrapped history method", { methodName });
		};
		wrapHistory("pushState");
		wrapHistory("replaceState");
		if (document.readyState === "loading") {
			logOnboarding("document still loading; adding DOMContentLoaded retry");
			document.addEventListener("DOMContentLoaded", () => tryShow("DOMContentLoaded"), { once: true });
		}
	}
	//#endregion
	//#region src/ui/styles.js
	/**
	* Inject UCM styles into the page.
	*/
	function injectStyles() {
		const style = document.createElement("style");
		style.textContent = `
    :root {
      --ucm-font-display: "Avenir Next Condensed", "Arial Narrow", "Franklin Gothic Medium", sans-serif;
      --ucm-font-body: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      --ucm-surface-base: #0b1317;
      --ucm-surface-panel: #101b21;
      --ucm-surface-strong: #15242c;
      --ucm-surface-muted: rgba(18, 33, 40, 0.82);
      --ucm-surface-soft: rgba(13, 22, 28, 0.72);
      --ucm-border-soft: rgba(180, 210, 218, 0.14);
      --ucm-border-strong: rgba(182, 230, 224, 0.28);
      --ucm-text-main: #eef6f3;
      --ucm-text-muted: #9eb3b3;
      --ucm-text-faint: #6f8688;
      --ucm-accent: #79e0c3;
      --ucm-accent-strong: #4ec3a1;
      --ucm-accent-warm: #f2b66d;
      --ucm-danger: #ff7d73;
      --ucm-success: #9df2bb;
      --ucm-info: #8cdbff;
      --ucm-shadow-panel: 0 28px 72px rgba(0, 0, 0, 0.44);
      --ucm-shadow-card: 0 14px 32px rgba(0, 0, 0, 0.22);
      --ucm-radius-xs: 10px;
      --ucm-radius-sm: 14px;
      --ucm-radius-md: 18px;
      --ucm-radius-lg: 26px;
      --ucm-space-1: 6px;
      --ucm-space-2: 10px;
      --ucm-space-3: 14px;
      --ucm-space-4: 18px;
      --ucm-space-5: 24px;
      --ucm-space-6: 32px;
      --ucm-panel-max-width: 32rem;
      --ucm-anim-fast: 140ms ease;
      --ucm-anim-panel: 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    #ucm-block-banner {
      background: linear-gradient(135deg, #d84b3b 0%, #c22f3d 100%);
      color: #fff5f4;
      padding: 10px 16px;
      text-align: center;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.02em;
      border-radius: var(--ucm-radius-xs);
      margin-bottom: 8px;
      z-index: 99999;
      font-family: var(--ucm-font-body);
      box-shadow: 0 10px 24px rgba(136, 22, 33, 0.28);
    }

    .ucm-notification {
      position: fixed;
      top: 12px;
      right: 12px;
      background: linear-gradient(180deg, rgba(16, 27, 33, 0.96) 0%, rgba(11, 19, 23, 0.98) 100%);
      color: var(--ucm-text-main);
      padding: 12px 16px;
      border-radius: var(--ucm-radius-sm);
      border: 1px solid var(--ucm-border-soft);
      font-size: 13px;
      font-family: var(--ucm-font-body);
      z-index: 100000;
      max-width: 22rem;
      box-shadow: var(--ucm-shadow-card);
      animation: ucm-slide-in 0.28s ease-out;
    }

    @keyframes ucm-slide-in {
      from { transform: translate3d(0, -8px, 0); opacity: 0; }
      to { transform: translate3d(0, 0, 0); opacity: 1; }
    }

    @keyframes ucm-slide-out {
      from { transform: translate3d(0, 0, 0); opacity: 1; }
      to { transform: translate3d(0, -8px, 0); opacity: 0; }
    }

    @keyframes ucm-panel-rise {
      from { transform: translate3d(0, 20px, 0); opacity: 0; }
      to { transform: translate3d(0, 0, 0); opacity: 1; }
    }

    @keyframes ucm-panel-slide-desktop {
      from { transform: translate3d(20px, 0, 0); opacity: 0; }
      to { transform: translate3d(0, 0, 0); opacity: 1; }
    }

    button[data-ucm-blocked="true"] {
      opacity: 0.5;
      cursor: not-allowed !important;
    }

    #ucm-onboarding-modal .ucm-onboarding-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100001;
      background: rgba(6, 10, 12, 0.76);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
    }

    #ucm-onboarding-modal .ucm-onboarding-card {
      width: min(420px, 100%);
      background: linear-gradient(180deg, #101b21 0%, #0b1317 100%);
      border: 1px solid var(--ucm-border-soft);
      border-radius: var(--ucm-radius-md);
      box-shadow: var(--ucm-shadow-panel);
      padding: 18px;
      color: var(--ucm-text-main);
      font-family: var(--ucm-font-body);
    }

    #ucm-onboarding-modal h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1;
      font-weight: 700;
      color: var(--ucm-text-main);
      font-family: var(--ucm-font-display);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    #ucm-onboarding-modal .ucm-onboarding-subtitle {
      margin: 8px 0 14px;
      color: var(--ucm-text-muted);
      font-size: 13px;
      line-height: 1.5;
    }


    #ucm-onboarding-modal label,
    #ucm-chain-panel-root label {
      display: block;
      margin-bottom: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ucm-text-faint);
    }

    #ucm-onboarding-modal input,
    #ucm-chain-panel-root .ucm-create-chain-form input,
    #ucm-chain-panel-root .ucm-create-chain-form textarea,
    #ucm-chain-panel-root .ucm-create-chain-form select,
    #ucm-chain-panel-root .ucm-subsection-card input,
    #ucm-chain-panel-root .ucm-subsection-card textarea,
    #ucm-chain-panel-root .ucm-subsection-card select,
    #ucm-chain-panel-root .ucm-command-modal-card input,
    #ucm-chain-panel-root .ucm-command-modal-card textarea,
    #ucm-chain-panel-root .ucm-command-modal-card select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid transparent;
      background: rgba(7, 13, 16, 0.94);
      color: var(--ucm-text-main);
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 14px;
      font-family: var(--ucm-font-body);
      outline: none;
      transition: border-color var(--ucm-anim-fast), box-shadow var(--ucm-anim-fast), background var(--ucm-anim-fast), transform var(--ucm-anim-fast);
      box-shadow: inset 0 0 0 1px rgba(180, 210, 218, 0.05);
    }

    #ucm-onboarding-modal input::placeholder,
    #ucm-chain-panel-root .ucm-create-chain-form input::placeholder,
    #ucm-chain-panel-root .ucm-create-chain-form textarea::placeholder,
    #ucm-chain-panel-root .ucm-subsection-card input::placeholder,
    #ucm-chain-panel-root .ucm-subsection-card textarea::placeholder,
    #ucm-chain-panel-root .ucm-command-modal-card input::placeholder,
    #ucm-chain-panel-root .ucm-command-modal-card textarea::placeholder {
      color: rgba(158, 179, 179, 0.72);
    }

    #ucm-onboarding-modal input:focus,
    #ucm-chain-panel-root .ucm-create-chain-form input:focus,
    #ucm-chain-panel-root .ucm-create-chain-form textarea:focus,
    #ucm-chain-panel-root .ucm-create-chain-form select:focus,
    #ucm-chain-panel-root .ucm-subsection-card input:focus,
    #ucm-chain-panel-root .ucm-subsection-card textarea:focus,
    #ucm-chain-panel-root .ucm-subsection-card select:focus,
    #ucm-chain-panel-root .ucm-command-modal-card input:focus,
    #ucm-chain-panel-root .ucm-command-modal-card textarea:focus,
    #ucm-chain-panel-root .ucm-command-modal-card select:focus {
      border-color: var(--ucm-border-strong);
      box-shadow: 0 0 0 3px rgba(121, 224, 195, 0.16);
      background: rgba(10, 18, 22, 0.98);
    }

    #ucm-onboarding-modal button,
    #ucm-chain-panel-root button {
      font-family: var(--ucm-font-body);
    }

    #ucm-onboarding-modal button,
    #ucm-chain-panel-root .ucm-create-chain-form button,
    #ucm-chain-panel-root .ucm-subsection-card button,
    #ucm-chain-panel-root .ucm-command-modal-card button,
    #ucm-chain-panel-root .ucm-inline-actions > button,
    #ucm-chain-panel-root .ucm-detail-tab,
    #ucm-chain-panel-root .ucm-floating-button,
    #ucm-chain-panel-root .ucm-primary-button {
      border: 0;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
      transition: transform var(--ucm-anim-fast), filter var(--ucm-anim-fast), opacity var(--ucm-anim-fast), background var(--ucm-anim-fast), color var(--ucm-anim-fast);
    }

    #ucm-onboarding-modal button,
    #ucm-chain-panel-root .ucm-create-chain-form button,
    #ucm-chain-panel-root .ucm-subsection-card button:not(.ucm-secondary-button),
    #ucm-chain-panel-root .ucm-command-modal-card button:not(.ucm-secondary-button),
    #ucm-chain-panel-root .ucm-inline-actions > button,
    #ucm-chain-panel-root .ucm-floating-button,
    #ucm-chain-panel-root .ucm-primary-button {
      padding: 12px 16px;
      background: linear-gradient(135deg, var(--ucm-accent) 0%, var(--ucm-accent-strong) 100%);
      color: #04110f;
      box-shadow: 0 10px 24px rgba(78, 195, 161, 0.26);
    }

    #ucm-chain-panel-root .ucm-secondary-button,
    #ucm-onboarding-modal .ucm-secondary-button,
    #ucm-chain-panel-root .ucm-command-modal-card .ucm-secondary-button,
    #ucm-chain-panel-root .ucm-detail-tab {
      padding: 11px 14px;
      background: rgba(255, 255, 255, 0.04);
      color: var(--ucm-text-muted);
      border: 1px solid var(--ucm-border-soft);
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-detail-tab.is-active {
      background: rgba(121, 224, 195, 0.14);
      border-color: rgba(121, 224, 195, 0.34);
      color: var(--ucm-text-main);
      box-shadow: inset 0 0 0 1px rgba(121, 224, 195, 0.08);
    }

    #ucm-chain-panel-root button:hover:not(:disabled),
    #ucm-onboarding-modal button:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }

    #ucm-chain-panel-root button:active:not(:disabled),
    #ucm-onboarding-modal button:active:not(:disabled) {
      transform: translateY(0);
      filter: brightness(0.98);
    }

    #ucm-chain-panel-root button:focus-visible,
    #ucm-onboarding-modal button:focus-visible {
      outline: 2px solid rgba(121, 224, 195, 0.88);
      outline-offset: 2px;
    }

    #ucm-onboarding-modal button:disabled,
    #ucm-chain-panel-root button:disabled,
    #ucm-chain-panel-root input:disabled,
    #ucm-chain-panel-root textarea:disabled,
    #ucm-chain-panel-root select:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }

    #ucm-onboarding-modal .ucm-onboarding-status,
    #ucm-chain-panel-root .ucm-modal-status {
      min-height: 18px;
      margin: 0;
      font-size: 12px;
      color: var(--ucm-info);
    }

    #ucm-onboarding-modal .ucm-onboarding-status[data-kind="success"],
    #ucm-chain-panel-root .ucm-modal-status[data-kind="success"] {
      color: var(--ucm-success);
    }

    #ucm-onboarding-modal .ucm-onboarding-status[data-kind="error"],
    #ucm-chain-panel-root .ucm-modal-status[data-kind="error"] {
      color: var(--ucm-danger);
    }

    #ucm-chain-panel-root .ucm-floating-button {
      position: fixed;
      right: 16px;
      bottom: 18px;
      z-index: 100000;
      min-height: 48px;
      padding-inline: 18px;
      background: linear-gradient(135deg, #95f0cd 0%, #58cda8 100%);
      color: #06211b;
      font-family: var(--ucm-font-display);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
    }

    #ucm-chain-panel-root .ucm-panel-shell[hidden] {
      display: none;
    }

    #ucm-chain-panel-root .ucm-panel-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 9, 0.66);
      backdrop-filter: blur(8px);
      z-index: 100001;
    }

    #ucm-chain-panel-root .ucm-panel {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 100002;
      display: flex;
      flex-direction: column;
      gap: var(--ucm-space-4);
      width: 100%;
      max-height: min(92vh, 58rem);
      overflow: auto;
      padding: max(16px, env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));
      box-sizing: border-box;
      border-top-left-radius: var(--ucm-radius-lg);
      border-top-right-radius: var(--ucm-radius-lg);
      border: 1px solid rgba(182, 230, 224, 0.12);
      border-bottom: 0;
      background:
        radial-gradient(circle at top right, rgba(121, 224, 195, 0.12), transparent 32%),
        linear-gradient(180deg, rgba(19, 35, 42, 0.98) 0%, rgba(11, 19, 23, 0.985) 100%);
      color: var(--ucm-text-main);
      box-shadow: var(--ucm-shadow-panel);
      font-family: var(--ucm-font-body);
      animation: ucm-panel-rise var(--ucm-anim-panel);
      overscroll-behavior: contain;
    }

    #ucm-chain-panel-root .ucm-panel-hero,
    #ucm-chain-panel-root .ucm-panel-toolbar {
      position: sticky;
      z-index: 2;
    }

    #ucm-chain-panel-root .ucm-panel-hero {
      top: calc(-1 * max(16px, env(safe-area-inset-top)));
      padding-top: max(16px, env(safe-area-inset-top));
      background: linear-gradient(180deg, rgba(16, 27, 33, 0.98) 70%, rgba(16, 27, 33, 0));
    }

    #ucm-chain-panel-root .ucm-panel-toolbar {
      top: 68px;
      padding-bottom: 8px;
      background: linear-gradient(180deg, rgba(16, 27, 33, 0.98) 68%, rgba(16, 27, 33, 0));
    }

    #ucm-chain-panel-root .ucm-panel-kicker {
      margin: 0 0 4px;
      color: var(--ucm-accent-warm);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    #ucm-chain-panel-root .ucm-panel h2,
    #ucm-chain-panel-root .ucm-panel h3,
    #ucm-chain-panel-root .ucm-panel h4 {
      margin: 0;
      color: var(--ucm-text-main);
    }

    #ucm-chain-panel-root .ucm-panel h2 {
      font-family: var(--ucm-font-display);
      font-size: clamp(1.75rem, 5vw, 2.25rem);
      line-height: 0.94;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      max-width: 10ch;
    }

    #ucm-chain-panel-root .ucm-panel h3 {
      font-size: 15px;
      letter-spacing: 0.02em;
    }

    #ucm-chain-panel-root .ucm-panel h4 {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ucm-text-muted);
    }

    #ucm-chain-panel-root .ucm-panel-subtitle,
    #ucm-chain-panel-root .ucm-section-copy,
    #ucm-chain-panel-root .ucm-state-note,
    #ucm-chain-panel-root .ucm-empty-state p,
    #ucm-chain-panel-root .ucm-chain-list-cta {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--ucm-text-muted);
    }

    #ucm-chain-panel-root .ucm-modal-close {
      width: 42px;
      height: 42px;
      border-radius: 999px;
      border: 1px solid var(--ucm-border-soft);
      background: rgba(255, 255, 255, 0.04);
      color: var(--ucm-text-main);
      font-size: 24px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-panel-section,
    #ucm-chain-panel-root .ucm-subsection-card {
      border: 1px solid var(--ucm-border-soft);
      border-radius: var(--ucm-radius-md);
      background: linear-gradient(180deg, rgba(18, 33, 40, 0.78) 0%, rgba(12, 20, 24, 0.82) 100%);
      box-shadow: var(--ucm-shadow-card);
    }

    #ucm-chain-panel-root .ucm-panel-section {
      padding: 16px;
    }

    #ucm-chain-panel-root .ucm-panel-section-emphasis {
      border-color: rgba(121, 224, 195, 0.18);
      background:
        linear-gradient(180deg, rgba(22, 38, 45, 0.92) 0%, rgba(13, 22, 27, 0.88) 100%),
        linear-gradient(120deg, rgba(121, 224, 195, 0.04), transparent 48%);
    }

    #ucm-chain-panel-root .ucm-inline-actions-wrap {
      flex-wrap: wrap;
    }

    #ucm-chain-panel-root .ucm-section-heading {
      display: grid;
      gap: 6px;
      margin-bottom: 14px;
    }

    #ucm-chain-panel-root .ucm-state-note {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(242, 182, 109, 0.1);
      border: 1px solid rgba(242, 182, 109, 0.16);
      color: #e7c08e;
    }


    #ucm-chain-panel-root .ucm-chain-list-item {
      width: 100%;
      padding: 16px;
      border: 1px solid rgba(121, 224, 195, 0.12);
      border-radius: 16px;
      background:
        linear-gradient(180deg, rgba(14, 25, 30, 0.98) 0%, rgba(12, 20, 24, 0.94) 100%),
        linear-gradient(90deg, rgba(121, 224, 195, 0.08), transparent 40%);
      color: var(--ucm-text-main);
      text-align: left;
      display: grid;
      gap: 8px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
    }

    #ucm-chain-panel-root .ucm-chain-list-item:hover {
      border-color: rgba(121, 224, 195, 0.28);
      background: linear-gradient(180deg, rgba(16, 29, 35, 0.99) 0%, rgba(12, 20, 24, 0.98) 100%);
    }

    #ucm-chain-panel-root .ucm-chain-list-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ucm-text-faint);
    }

    #ucm-chain-panel-root .ucm-chain-list-title {
      font-family: var(--ucm-font-display);
      font-size: 20px;
      line-height: 0.98;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }


    #ucm-chain-panel-root .ucm-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(121, 224, 195, 0.12);
      color: var(--ucm-accent);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border: 1px solid rgba(121, 224, 195, 0.16);
      width: fit-content;
    }

    #ucm-chain-panel-root .ucm-empty-state {
      padding: 18px;
      border-radius: 16px;
      border: 1px dashed rgba(180, 210, 218, 0.16);
      background: rgba(7, 13, 16, 0.52);
      display: grid;
      gap: 6px;
      color: var(--ucm-text-muted);
    }

    #ucm-chain-panel-root .ucm-empty-state strong {
      font-family: var(--ucm-font-display);
      font-size: 18px;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ucm-text-main);
    }


    #ucm-chain-panel-root .ucm-summary-item {
      padding: 12px;
      border-radius: 14px;
      background: rgba(7, 13, 16, 0.56);
      border: 1px solid rgba(180, 210, 218, 0.08);
      display: grid;
      gap: 4px;
    }

    #ucm-chain-panel-root .ucm-summary-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ucm-text-faint);
    }

    #ucm-chain-panel-root .ucm-summary-item strong {
      font-size: 14px;
      font-weight: 700;
      color: var(--ucm-text-main);
    }

    #ucm-chain-panel-root .ucm-summary-notes {
      margin: 0;
      padding: 14px;
      border-radius: 14px;
      background: rgba(7, 13, 16, 0.46);
      color: var(--ucm-text-muted);
      white-space: pre-wrap;
      line-height: 1.55;
      border: 1px solid rgba(180, 210, 218, 0.08);
    }

    #ucm-chain-panel-root .ucm-detail-switcher {
      margin-bottom: 14px;
    }

    #ucm-chain-panel-root .ucm-detail-section {
      animation: ucm-slide-in 0.18s ease;
    }

    #ucm-chain-panel-root .ucm-subsection-card {
      padding: 14px;
      display: grid;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-checkbox-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 0;
      font-size: 13px;
      color: var(--ucm-text-main);
    }

    #ucm-chain-panel-root .ucm-checkbox-row input {
      width: auto;
      margin: 0;
      accent-color: var(--ucm-accent-strong);
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-command-list {
      display: grid;
      gap: 10px;
    }

    #ucm-chain-panel-root .ucm-command-row {
      width: 100%;
      min-height: 58px;
      padding: 10px 12px;
      border: 1px solid rgba(180, 210, 218, 0.1);
      border-radius: 14px;
      background: rgba(7, 13, 16, 0.52);
      color: var(--ucm-text-main);
      display: grid;
      grid-template-columns: 38px 1fr;
      align-items: center;
      gap: 12px;
      text-align: left;
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-command-row.is-danger {
      border-color: rgba(255, 125, 115, 0.22);
      background: rgba(255, 125, 115, 0.08);
    }

    #ucm-chain-panel-root .ucm-command-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(121, 224, 195, 0.12);
      color: var(--ucm-accent);
      font-size: 17px;
    }

    #ucm-chain-panel-root .ucm-command-row strong,
    #ucm-chain-panel-root .ucm-member-card strong {
      display: block;
      color: var(--ucm-text-main);
      font-size: 13px;
      line-height: 1.2;
    }

    #ucm-chain-panel-root .ucm-command-row small,
    #ucm-chain-panel-root .ucm-member-card span,
    #ucm-chain-panel-root .ucm-member-stat-grid small {
      display: block;
      color: var(--ucm-text-muted);
      font-size: 11px;
      line-height: 1.35;
      letter-spacing: 0;
      text-transform: none;
    }

    #ucm-chain-panel-root .ucm-command-modal[hidden] {
      display: none;
    }

    #ucm-chain-panel-root .ucm-command-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100003;
      background: rgba(4, 7, 9, 0.72);
      backdrop-filter: blur(6px);
    }

    #ucm-chain-panel-root .ucm-command-modal-card {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: max(12px, env(safe-area-inset-bottom));
      z-index: 100004;
      max-height: min(82vh, 38rem);
      overflow: auto;
      display: grid;
      gap: 14px;
      padding: 16px;
      border-radius: 20px;
      border: 1px solid rgba(182, 230, 224, 0.16);
      background: linear-gradient(180deg, rgba(19, 35, 42, 0.98) 0%, rgba(11, 19, 23, 0.99) 100%);
      color: var(--ucm-text-main);
      box-shadow: var(--ucm-shadow-panel);
      animation: ucm-panel-rise var(--ucm-anim-panel);
    }

    #ucm-chain-panel-root .ucm-command-modal-body {
      display: grid;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-command-modal-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }

    #ucm-chain-panel-root .ucm-member-grid {
      display: grid;
      gap: 10px;
    }

    #ucm-chain-panel-root .ucm-member-section {
      display: grid;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-member-card {
      display: grid;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid rgba(180, 210, 218, 0.1);
      background: rgba(7, 13, 16, 0.5);
    }

    #ucm-chain-panel-root .ucm-member-card.is-online {
      border-color: rgba(157, 242, 187, 0.22);
      background:
        linear-gradient(180deg, rgba(15, 35, 27, 0.44), rgba(7, 13, 16, 0.5));
    }

    #ucm-chain-panel-root .ucm-member-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-presence-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--ucm-text-faint);
      margin-top: 4px;
      box-shadow: 0 0 0 4px rgba(111, 134, 136, 0.12);
    }

    #ucm-chain-panel-root .ucm-member-card.is-online .ucm-presence-dot {
      background: var(--ucm-success);
      box-shadow: 0 0 0 4px rgba(157, 242, 187, 0.12);
    }

    #ucm-chain-panel-root .ucm-member-stat-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-kv {
      min-width: 0;
      padding: 10px;
      border-radius: 12px;
      background: rgba(7, 13, 16, 0.54);
      border: 1px solid rgba(180, 210, 218, 0.08);
    }

    #ucm-chain-panel-root .ucm-diagnostics-kv span {
      display: block;
      margin-bottom: 4px;
      color: var(--ucm-text-faint);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    #ucm-chain-panel-root .ucm-diagnostics-kv strong {
      display: block;
      min-width: 0;
      color: var(--ucm-text-main);
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    #ucm-chain-panel-root .ucm-diagnostics-log {
      display: grid;
      gap: 8px;
      max-height: 340px;
      overflow: auto;
      padding-right: 2px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry {
      display: grid;
      grid-template-columns: auto auto minmax(0, 1fr);
      gap: 6px;
      align-items: baseline;
      padding: 9px 10px;
      border-radius: 12px;
      background: rgba(7, 13, 16, 0.56);
      border: 1px solid rgba(180, 210, 218, 0.08);
      color: var(--ucm-text-muted);
      font-size: 11px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry span {
      color: var(--ucm-text-faint);
      font-variant-numeric: tabular-nums;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry b {
      color: var(--ucm-text-main);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry p {
      min-width: 0;
      margin: 0;
      overflow-wrap: anywhere;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry code {
      grid-column: 1 / -1;
      display: block;
      padding: 6px 8px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.24);
      color: var(--ucm-text-muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1.45;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry-ok {
      border-color: rgba(157, 242, 187, 0.18);
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry-warn {
      border-color: rgba(242, 182, 109, 0.22);
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry-error {
      border-color: rgba(255, 125, 115, 0.28);
    }

    #ucm-chain-panel-root .ucm-member-stat-grid span {
      display: grid;
      gap: 2px;
      padding: 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.035);
    }

    #ucm-chain-panel-root .ucm-member-stat-grid b {
      color: var(--ucm-text-main);
      font-size: 12px;
      font-weight: 700;
    }

    #ucm-chain-panel-root .ucm-member-command {
      width: 100%;
    }

    @media (min-width: 720px) {
      #ucm-chain-panel-root .ucm-floating-button {
        right: 22px;
        bottom: 22px;
      }

      #ucm-chain-panel-root .ucm-panel {
        inset: 14px 14px 14px auto;
        width: min(var(--ucm-panel-max-width), calc(100vw - 28px));
        max-height: calc(100vh - 28px);
        border-radius: 24px;
        border: 1px solid rgba(182, 230, 224, 0.14);
        animation: ucm-panel-slide-desktop var(--ucm-anim-panel);
        padding: 18px 18px 20px;
      }

      #ucm-chain-panel-root .ucm-panel-hero {
        top: -18px;
        padding-top: 18px;
      }

      #ucm-chain-panel-root .ucm-command-modal-card {
        left: auto;
        right: 32px;
        bottom: 32px;
        width: min(420px, calc(100vw - 64px));
      }

      #ucm-chain-panel-root .ucm-member-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      #ucm-chain-panel-root .ucm-panel-toolbar {
        top: 74px;
      }

      #ucm-chain-panel-root .ucm-form-grid,
      #ucm-chain-panel-root .ucm-detail-stack {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      #ucm-chain-panel-root .ucm-detail-stack .ucm-subsection-card:last-child:nth-child(odd) {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 479px) {
      #ucm-chain-panel-root .ucm-summary-grid {
        grid-template-columns: 1fr;
      }

      #ucm-chain-panel-root .ucm-panel h2 {
        max-width: none;
      }
    }

    #ucm-chain-panel-root .ucm-danger-zone {
      border-color: rgba(220, 80, 80, 0.3);
    }

    #ucm-chain-panel-root .ucm-danger-button {
      padding: 11px 14px;
      background: rgba(220, 80, 80, 0.18);
      color: #e06060;
      border: 1px solid rgba(220, 80, 80, 0.35);
      border-radius: var(--ucm-radius);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-danger-button:hover:not(:disabled) {
      background: rgba(220, 80, 80, 0.28);
    }
  `;
		document.head.appendChild(style);
	}
	//#endregion
	//#region src/api/sse-client.js
	/**
	* SSE client implemented on top of GM_xmlhttpRequest.
	*
	* The native EventSource API is subject to the page's Content Security Policy,
	* and Torn's CSP does not whitelist our backend in `connect-src`. Routing the
	* stream through the userscript manager (which respects `@connect` metadata)
	* is the only way to keep a long-lived connection open on torn.com.
	*
	* We read the text response incrementally via `onprogress` and parse the SSE
	* wire format manually: blocks separated by a blank line, each with `event:`,
	* `data:`, and (optionally) `id:` fields.
	*/
	var MAX_RECONNECT_DELAY = 3e4;
	var SUPPORTED_EVENT_TYPES = new Set([
		"command.hold_all",
		"command.release_all",
		"target.assigned",
		"bonus.locked",
		"attack_pass.issued",
		"defense.alert",
		"presence.updated"
	]);
	var currentRequest = null;
	var reconnectAttempts = 0;
	var disposed = false;
	var onEventCallback = null;
	var lastEventId = 0;
	function scheduleReconnect() {
		if (disposed) return;
		const base = Math.min(1e3 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
		const jitter = Math.floor(Math.random() * 500);
		reconnectAttempts += 1;
		setSseStatus("reconnecting", {
			reconnectAttempts,
			delayMs: base + jitter,
			lastEventId
		});
		setTimeout(() => {
			if (!disposed) openStream();
		}, base + jitter);
	}
	function dispatchBlock(block) {
		let eventType = "message";
		const dataLines = [];
		let id = "0";
		for (const rawLine of block.split("\n")) {
			const line = rawLine.replace(/\r$/, "");
			if (!line) continue;
			if (line.startsWith(":")) continue;
			const colon = line.indexOf(":");
			const field = colon === -1 ? line : line.slice(0, colon);
			let value = colon === -1 ? "" : line.slice(colon + 1);
			if (value.startsWith(" ")) value = value.slice(1);
			if (field === "event") eventType = value;
			else if (field === "data") dataLines.push(value);
			else if (field === "id") id = value;
		}
		if (dataLines.length === 0) return;
		if (!SUPPORTED_EVENT_TYPES.has(eventType)) return;
		const payload = dataLines.join("\n");
		try {
			const parsed = JSON.parse(payload);
			const parsedId = parseInt(id, 10) || 0;
			if (parsedId > lastEventId) lastEventId = parsedId;
			onEventCallback(eventType, parsed, parsedId);
			logDiagnostic("ok", "sse", `event ${eventType}`, {
				eventId: parsedId,
				lastEventId
			});
		} catch (err) {
			logDiagnostic("warn", "sse", "failed to parse SSE event", { message: err?.message || "unknown error" });
		}
	}
	function openStream() {
		const gmRequest = getStreamingUserscriptRequest();
		if (!gmRequest) {
			setSseStatus("error", {
				message: "Streaming userscript transport unavailable. TornPDA may not expose GM_xmlhttpRequest for SSE.",
				hasPdaHttpGet: typeof PDA_httpGet === "function"
			});
			return;
		}
		const url = `${CONFIG.BACKEND_URL}/events/stream?token=${encodeURIComponent(state.sessionToken)}`;
		let buffer = "";
		let lastTextLength = 0;
		let announcedOpen = false;
		const markOpen = () => {
			if (announcedOpen) return;
			announcedOpen = true;
			reconnectAttempts = 0;
			setSseStatus("connected", { lastEventId });
		};
		const ingest = (response) => {
			const text = response?.responseText || "";
			if (text.length <= lastTextLength) return;
			const chunk = text.slice(lastTextLength);
			lastTextLength = text.length;
			buffer += chunk;
			const separator = /\r?\n\r?\n/;
			let match;
			while ((match = separator.exec(buffer)) !== null) {
				const block = buffer.slice(0, match.index);
				buffer = buffer.slice(match.index + match[0].length);
				if (block.length > 0) dispatchBlock(block);
			}
		};
		currentRequest = gmRequest({
			method: "GET",
			url,
			headers: {
				Accept: "text/event-stream",
				"Cache-Control": "no-cache",
				...lastEventId > 0 ? { "Last-Event-ID": String(lastEventId) } : {}
			},
			responseType: "text",
			onloadstart: markOpen,
			onprogress: (response) => {
				markOpen();
				ingest(response);
			},
			onload: (response) => {
				ingest(response);
				if (disposed) return;
				logDiagnostic("warn", "sse", "SSE stream ended", { lastEventId });
				scheduleReconnect();
			},
			onerror: () => {
				if (disposed) return;
				logDiagnostic("warn", "sse", "SSE connection error", { lastEventId });
				scheduleReconnect();
			},
			ontimeout: () => {
				if (disposed) return;
				logDiagnostic("warn", "sse", "SSE timed out", { lastEventId });
				scheduleReconnect();
			}
		});
	}
	function connectSSE(onEvent) {
		if (currentRequest && onEventCallback === onEvent && !disposed) return;
		onEventCallback = onEvent;
		disposed = false;
		reconnectAttempts = 0;
		setSseStatus("connecting", { lastEventId });
		if (currentRequest && typeof currentRequest.abort === "function") try {
			currentRequest.abort();
		} catch {}
		currentRequest = null;
		openStream();
	}
	function disconnectSSE() {
		disposed = true;
		reconnectAttempts = 0;
		setSseStatus("disconnected", { lastEventId });
		if (currentRequest && typeof currentRequest.abort === "function") try {
			currentRequest.abort();
		} catch {}
		currentRequest = null;
	}
	//#endregion
	//#region src/dom/selectors.js
	function isAttackPage() {
		try {
			const url = new URL(window.location.href);
			return url.pathname === "/page.php" && url.searchParams.get("sid") === "attack";
		} catch {
			return false;
		}
	}
	/**
	* 4-tier attack button selector fallback strategy.
	* Returns the button element or null.
	*/
	/** Tier 1: Exact CSS selector from settings */
	function findByCssSelector() {
		try {
			const btn = document.querySelector(CONFIG.SELECTORS.CSS);
			if (btn && isStartFightButton(btn)) return btn;
		} catch (e) {}
		return null;
	}
	/** Tier 2: Semantic selector inside defender modal */
	function findBySemanticSelector() {
		const buttons = document.querySelectorAll("button[type=\"submit\"]");
		for (const btn of buttons) if (isVisible(btn) && isStartFightButton(btn)) return btn;
		return null;
	}
	/** Tier 3: XPath fallback */
	function findByXpath() {
		try {
			const btn = document.evaluate(CONFIG.SELECTORS.XPATH, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			if (btn && isStartFightButton(btn)) return btn;
		} catch (e) {}
		return null;
	}
	/** Tier 4: Last resort text match */
	function findByTextMatch() {
		const buttons = document.querySelectorAll("button");
		for (const btn of buttons) if (btn.textContent.trim() === "Start fight" && isVisible(btn)) return btn;
		return null;
	}
	/**
	* Try all 4 tiers in order, return first match.
	*/
	function findAttackButton() {
		return findByCssSelector() || findBySemanticSelector() || findByXpath() || findByTextMatch();
	}
	function isStartFightButton(btn) {
		return btn.textContent.trim().toLowerCase() === "start fight";
	}
	function isVisible(el) {
		if (!el) return false;
		const style = window.getComputedStyle(el);
		return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && el.offsetParent !== null;
	}
	//#endregion
	//#region src/dom/banner.js
	var BANNER_ID = "ucm-block-banner";
	/**
	* Show a contextual banner above the attack button.
	*/
	function showBanner(message) {
		const existing = document.getElementById(BANNER_ID);
		if (existing) {
			if (existing.textContent !== message) existing.textContent = message;
			return;
		}
		const banner = document.createElement("div");
		banner.id = BANNER_ID;
		banner.textContent = message;
		banner.style.cssText = `
    background: #e74c3c;
    color: white;
    padding: 8px 16px;
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    border-radius: 4px;
    margin-bottom: 8px;
    z-index: 99999;
  `;
		const defenderModal = document.querySelector("[class*=\"defender\"]");
		if (defenderModal) defenderModal.insertBefore(banner, defenderModal.firstChild);
		else {
			banner.style.cssText += "position: fixed; top: 0; left: 0; right: 0;";
			document.body.prepend(banner);
		}
	}
	/**
	* Remove the UCM banner from the DOM.
	*/
	function removeBanner() {
		const existing = document.getElementById(BANNER_ID);
		if (existing) existing.remove();
	}
	//#endregion
	//#region src/dom/attack-button.js
	var blockedButtonRef = null;
	var clickGuardInstalled = false;
	var lastMissingButtonLogAt = 0;
	/**
	* Block the attack button: disable it, mark it, show tooltip and banner.
	*/
	function blockButton() {
		if (!isAttackPage()) {
			removeBanner();
			return;
		}
		const btn = findAttackButton();
		if (!btn) {
			const now = Date.now();
			if (now - lastMissingButtonLogAt > 5e3) {
				lastMissingButtonLogAt = now;
				logDiagnostic("info", "attack", "attack page detected, but no attack button found yet");
			}
			return;
		}
		if (!(btn.getAttribute("data-ucm-blocked") === "true" && btn.disabled && btn.getAttribute("aria-disabled") === "true")) logDiagnostic("ok", "attack", "blocking attack button");
		btn.disabled = true;
		btn.setAttribute("data-ucm-blocked", "true");
		btn.title = "Blocked by Ultimate Chain Manager";
		btn.style.pointerEvents = "none";
		btn.setAttribute("aria-disabled", "true");
		blockedButtonRef = new WeakRef(btn);
		showBanner(getBlockReason());
	}
	/**
	* Unblock the attack button: re-enable it, remove markers and banner.
	*/
	function unblockButton() {
		if (!isAttackPage()) {
			blockedButtonRef = null;
			removeBanner();
			return;
		}
		const btn = getBlockedButton() || findAttackButton();
		if (!btn) return;
		btn.disabled = false;
		btn.removeAttribute("data-ucm-blocked");
		btn.title = "";
		btn.style.pointerEvents = "";
		btn.removeAttribute("aria-disabled");
		blockedButtonRef = null;
		logDiagnostic("ok", "attack", "unblocking attack button");
		removeBanner();
	}
	/**
	* Get the currently blocked button via WeakRef, if still in DOM.
	*/
	function getBlockedButton() {
		if (!blockedButtonRef) return null;
		const btn = blockedButtonRef.deref();
		if (!btn || !btn.isConnected) {
			blockedButtonRef = null;
			return null;
		}
		return btn;
	}
	/**
	* Re-apply block if state says we should be blocked.
	* Called by MutationObserver after DOM changes.
	*/
	function reapplyIfNeeded(shouldBlock) {
		if (!isAttackPage()) {
			if (getBlockedButton()) unblockButton();
			else removeBanner();
			return;
		}
		if (shouldBlock) blockButton();
		else if (getBlockedButton()) unblockButton();
	}
	function installAttackClickGuard(isBlockedFn) {
		if (clickGuardInstalled) return;
		clickGuardInstalled = true;
		document.addEventListener("click", (event) => {
			if (!isAttackPage()) return;
			if (!isBlockedFn()) return;
			const button = event.target instanceof Element ? event.target.closest("button") : null;
			if (!button) return;
			if (button.getAttribute("data-ucm-blocked") === "true" || button.textContent.trim().toLowerCase() === "start fight") {
				logDiagnostic("warn", "attack", "blocked attack click intercepted");
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				blockButton();
			}
		}, true);
		document.addEventListener("submit", (event) => {
			if (!isAttackPage()) return;
			if (!isBlockedFn()) return;
			const form = event.target instanceof HTMLFormElement ? event.target : null;
			if (!form) return;
			const blockedButton = findAttackButton();
			if (!blockedButton) return;
			if (!form.contains(blockedButton)) return;
			logDiagnostic("warn", "attack", "blocked attack form submit intercepted");
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			blockButton();
		}, true);
	}
	//#endregion
	//#region src/ui/notifications.js
	var notificationCount = 0;
	/**
	* Show a toast notification that auto-dismisses after 10 seconds.
	*/
	function showNotification(message, durationMs = 1e4) {
		const id = `ucm-notification-${++notificationCount}`;
		const el = document.createElement("div");
		el.id = id;
		el.className = "ucm-notification";
		el.textContent = message;
		const topOffset = 10 + document.querySelectorAll(".ucm-notification").length * 60;
		el.style.top = `${topOffset}px`;
		document.body.appendChild(el);
		setTimeout(() => {
			el.style.animation = "ucm-slide-out 0.3s ease-in forwards";
			setTimeout(() => el.remove(), 300);
		}, durationMs);
	}
	//#endregion
	//#region src/events/handler.js
	/**
	* Handle a single event from the SSE stream.
	* Called with (type, payload, eventId) from the SSE client.
	*/
	function handleEvent(type, payload, eventId) {
		if (eventId && eventId > state.eventCursor) state.eventCursor = eventId;
		switch (type) {
			case "command.hold_all":
				handleHoldAll(payload);
				break;
			case "command.release_all":
				handleReleaseAll(payload);
				break;
			case "target.assigned":
				handleTargetAssigned(payload);
				break;
			case "bonus.locked":
				handleBonusLocked(payload);
				break;
			case "attack_pass.issued":
				handlePassIssued(payload);
				break;
			case "defense.alert":
				handleDefenseAlert(payload);
				break;
			case "presence.updated": break;
			default: logDiagnostic("warn", "events", "unknown event type", { type });
		}
	}
	function handleHoldAll(payload) {
		state.commandMode = "hold_all";
		if (!state.permissions.includes("attack.block.exempt")) {
			blockButton();
			showBanner(payload.reason || "Hold active");
		}
	}
	function handleReleaseAll(payload) {
		state.commandMode = "free";
		state.myActivePass = null;
		unblockButton();
		removeBanner();
	}
	function handleTargetAssigned(payload) {
		if (payload.assigneeMemberId === state.memberId) {
			state.myAssignment = {
				hitNumber: payload.hitNumber,
				enemyTornUserId: payload.enemyTornUserId
			};
			showNotification(`You are assigned hit #${payload.hitNumber}`);
		}
	}
	function handleBonusLocked(payload) {
		state.commandMode = "bonus_lock";
		state.bonusLockAssigneeMemberId = payload.assigneeMemberId;
		const isAssignee = payload.assigneeMemberId === state.memberId;
		const isExempt = state.permissions.includes("attack.block.exempt");
		if (!isAssignee && !isExempt) {
			blockButton();
			showBanner(`Bonus hit #${payload.hitNumber} reserved`);
		}
	}
	function handlePassIssued(payload) {
		state.myActivePass = {
			id: payload.attackPassId,
			expiresAt: new Date(payload.expiresAt)
		};
		unblockButton();
		removeBanner();
		showBanner(`One-time pass active — ${payload.reason || "Go!"}`);
		const ttlMs = new Date(payload.expiresAt).getTime() - Date.now();
		if (ttlMs > 0) setTimeout(() => {
			if (state.myActivePass && state.myActivePass.id === payload.attackPassId) {
				state.myActivePass = null;
				blockButton();
				showBanner(state.commandMode === "bonus_lock" ? "Bonus lock active" : "Hold active");
			}
		}, ttlMs);
	}
	function handleDefenseAlert(payload) {
		showNotification(`\u26A0 ${payload.memberName} is being attacked by ${payload.attackerName}`);
	}
	//#endregion
	//#region src/ui/chain-list.js
	/**
	* Client-rendered chain list component.
	* Replaces the SSR GET /ui/chains endpoint.
	*/
	function hasSchedulePermission() {
		return Array.isArray(state.permissions) && state.permissions.includes("chain.schedule");
	}
	function formatScheduledTime(isoString) {
		if (!isoString) return "Not scheduled";
		try {
			return new Date(isoString).toLocaleString(void 0, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit"
			});
		} catch {
			return isoString;
		}
	}
	function statusPillColor(status) {
		switch (status) {
			case "active": return "var(--ucm-success)";
			case "scheduled": return "var(--ucm-accent)";
			case "completed": return "var(--ucm-text-faint)";
			case "cancelled": return "var(--ucm-danger)";
			default: return "var(--ucm-text-muted)";
		}
	}
	/**
	* Render chain list HTML from API data.
	* Returns the HTML string for embedding into the panel shell.
	*/
	async function renderChainListHTML() {
		const chains = (await listChains())?.chains || [];
		if (chains.length === 0) return `
      <div class="ucm-empty-state">
        <strong>No chains</strong>
        <p>No chains have been scheduled yet.${hasSchedulePermission() ? " Create one to get started." : ""}</p>
      </div>
      ${hasSchedulePermission() ? "<button id=\"ucm-add-chain-button\" class=\"ucm-primary-button\" type=\"button\">New Chain</button>" : ""}
    `;
		return `
    <div class="ucm-chain-list u-grid u-gap-3">
      ${chains.map((chain) => {
			const pillColor = statusPillColor(chain.status);
			return `
      <button class="ucm-chain-list-item" data-chain-id="${chain.id}" type="button">
        <span class="ucm-chain-list-eyebrow">${formatScheduledTime(chain.scheduledStartUtc)}</span>
        <span class="ucm-chain-list-title">${escapeHtml$1(chain.title || "Untitled Chain")}</span>
        <div class="ucm-chain-list-row u-flex u-items-center u-justify-between u-gap-ucm-3">
          <span class="ucm-status-pill" style="color: ${pillColor}; border-color: ${pillColor}33; background: ${pillColor}1a;">
            ${escapeHtml$1(chain.status || "unknown")}
          </span>
          ${chain.expectedDurationMinutes ? `<span class="ucm-chain-list-cta">${chain.expectedDurationMinutes}m</span>` : ""}
        </div>
      </button>
    `;
		}).join("")}
    </div>
    ${hasSchedulePermission() ? "<button id=\"ucm-add-chain-button\" class=\"ucm-primary-button\" type=\"button\">New Chain</button>" : ""}
  `;
	}
	function escapeHtml$1(str) {
		const div = document.createElement("div");
		div.textContent = str;
		return div.innerHTML;
	}
	//#endregion
	//#region src/ui/chain-create.js
	/**
	* Client-rendered chain creation form.
	* Replaces the SSR GET /ui/chains/new endpoint.
	*/
	function formatDateTimeLocal(date) {
		return (/* @__PURE__ */ new Date(date.getTime() - date.getTimezoneOffset() * 6e4)).toISOString().slice(0, 16);
	}
	/**
	* Render chain creation form HTML.
	* Returns the HTML string for embedding into the panel shell.
	*/
	function renderChainCreateHTML() {
		return `
    <form id="ucm-create-chain-form" class="ucm-create-chain-form">
      <div class="ucm-form-grid u-grid u-gap-3">
        <div>
          <label for="ucm-chain-title">Title</label>
          <input id="ucm-chain-title" name="title" type="text" maxlength="120" placeholder="Example: Evening chain" required />
        </div>

        <div>
          <label for="ucm-chain-start">Start Time</label>
          <input id="ucm-chain-start" name="scheduledStartUtc" type="datetime-local" value="${formatDateTimeLocal(new Date(Date.now() + 300 * 1e3))}" required />
        </div>

        <div>
          <label for="ucm-chain-duration">Duration (minutes)</label>
          <input id="ucm-chain-duration" name="expectedDurationMinutes" type="number" min="1" step="1" value="30" required />
        </div>

        <div>
          <label class="ucm-checkbox-row" for="ucm-chain-war-mode">
            <input id="ucm-chain-war-mode" name="warMode" type="checkbox" />
            <span>War mode</span>
          </label>
        </div>

        <div>
          <label for="ucm-chain-enemy-faction">Enemy Faction ID</label>
          <input id="ucm-chain-enemy-faction" name="enemyFactionTornId" type="number" min="1" step="1" placeholder="Optional" />
        </div>

        <div class="u-col-span-full">
          <label for="ucm-chain-notes">Notes</label>
          <textarea id="ucm-chain-notes" name="notes" rows="3" maxlength="1000" placeholder="Optional notes"></textarea>
        </div>
      </div>

      <div class="ucm-form-actions u-flex u-items-center u-justify-between u-gap-ucm-2 u-flex-wrap u-mt-ucm-3">
        <button id="ucm-back-to-chains" class="ucm-secondary-button" type="button">Cancel</button>
        <button id="ucm-create-chain-submit" type="submit">Create Chain</button>
      </div>
      <p id="ucm-chain-panel-status" class="ucm-modal-status" aria-live="polite"></p>
    </form>
  `;
	}
	function parseOptionalNumber(value) {
		const trimmed = value.trim();
		if (!trimmed) return null;
		const parsed = Number(trimmed);
		if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Enemy faction ID must be a positive integer.");
		return parsed;
	}
	/**
	* Build and validate the chain creation payload from form data.
	*/
	function buildChainPayload(formData) {
		const title = String(formData.get("title") || "").trim();
		const scheduledStartLocal = String(formData.get("scheduledStartUtc") || "").trim();
		const duration = Number(formData.get("expectedDurationMinutes"));
		const notes = String(formData.get("notes") || "").trim();
		const warMode = formData.get("warMode") === "on";
		const enemyFactionTornId = parseOptionalNumber(String(formData.get("enemyFactionTornId") || ""));
		if (!title) throw new Error("Title is required.");
		if (!scheduledStartLocal) throw new Error("Start time is required.");
		const scheduledStart = new Date(scheduledStartLocal);
		if (Number.isNaN(scheduledStart.getTime())) throw new Error("Start time is invalid.");
		if (!Number.isInteger(duration) || duration <= 0) throw new Error("Duration must be a positive number of minutes.");
		return {
			title,
			scheduledStartUtc: scheduledStart.toISOString(),
			expectedDurationMinutes: duration,
			warMode,
			enemyFactionTornId,
			notes: notes || null
		};
	}
	/**
	* Submit the chain creation form.
	* Returns the created chain response on success.
	*/
	async function submitChainCreate(formData) {
		const payload = buildChainPayload(formData);
		const response = await createChain(payload);
		state.currentChainId = response?.chain?.id || null;
		showNotification(`Chain created: ${payload.title}`);
		return response;
	}
	//#endregion
	//#region src/ui/chain-panel.js
	var CHAIN_PANEL_ROOT_ID = "ucm-chain-panel-root";
	var DEFAULT_DETAIL_SECTION = "primary";
	var activeDetailSection = DEFAULT_DETAIL_SECTION;
	function hasAnyChainControlPermission() {
		return Array.isArray(state.permissions) && (state.permissions.includes("chain.schedule") || state.permissions.includes("chain.lead") || state.permissions.includes("overwatch.view"));
	}
	function escapeHtml(value) {
		const div = document.createElement("div");
		div.textContent = value == null ? "" : String(value);
		return div.innerHTML;
	}
	function formatDate(isoString) {
		if (!isoString) return "—";
		try {
			return new Date(isoString).toLocaleString(void 0, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit"
			});
		} catch {
			return isoString;
		}
	}
	function formatRelativeTime(isoString) {
		if (!isoString) return "No recent check-in";
		const diffMs = Date.now() - new Date(isoString).getTime();
		if (!Number.isFinite(diffMs)) return "Unknown";
		if (diffMs < 6e4) return "Just now";
		const minutes = Math.floor(diffMs / 6e4);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return formatDate(isoString);
	}
	function presenceLabel(member) {
		if (member.isOnline) return "Online";
		return String(member.presenceState || "").replaceAll("_", " ") || "Offline";
	}
	function formatEnergy(member) {
		return member.energy == null ? "—" : `${member.energy}e`;
	}
	function formatHealth(member) {
		if (member.lifeCurrent == null || member.lifeMax == null) return "—";
		return `${member.lifeCurrent}/${member.lifeMax}`;
	}
	function getElements() {
		return {
			root: document.getElementById(CHAIN_PANEL_ROOT_ID),
			shell: document.getElementById("ucm-chain-panel-shell"),
			button: document.getElementById("ucm-chain-panel-button"),
			close: document.getElementById("ucm-chain-panel-close"),
			refresh: document.getElementById("ucm-chain-panel-refresh"),
			diagnostics: document.getElementById("ucm-chain-panel-diagnostics"),
			status: document.getElementById("ucm-chain-panel-status"),
			addChain: document.getElementById("ucm-add-chain-button"),
			back: document.getElementById("ucm-back-to-chains"),
			backSecondary: document.getElementById("ucm-back-to-chains-secondary"),
			createForm: document.getElementById("ucm-create-chain-form"),
			rsvpForm: document.getElementById("ucm-rsvp-form"),
			rsvpEdit: document.getElementById("ucm-rsvp-edit"),
			commandButtons: Array.from(document.querySelectorAll("[data-ucm-command]")),
			commandModal: document.getElementById("ucm-command-modal"),
			commandModalBody: document.getElementById("ucm-command-modal-body"),
			commandModalTitle: document.getElementById("ucm-command-modal-title"),
			commandModalClose: document.getElementById("ucm-command-modal-close"),
			commandModalCancel: document.getElementById("ucm-command-modal-cancel"),
			commandModalForm: document.getElementById("ucm-command-modal-form"),
			chainButtons: Array.from(document.querySelectorAll(".ucm-chain-list-item")),
			sectionTabs: Array.from(document.querySelectorAll("[data-ucm-section]")),
			sectionPanels: Array.from(document.querySelectorAll("[data-ucm-section-panel]"))
		};
	}
	function setChainPanelStatus(message, kind = "info") {
		const { status } = getElements();
		if (!status) return;
		status.textContent = message;
		status.dataset.kind = kind;
	}
	function getCurrentView() {
		return document.getElementById("ucm-chain-panel-shell")?.dataset.ucmView || "list";
	}
	function getCurrentChainId() {
		return document.getElementById("ucm-chain-panel-shell")?.dataset.chainId || "";
	}
	function applyDetailSection(section = DEFAULT_DETAIL_SECTION) {
		const { sectionTabs, sectionPanels } = getElements();
		if (!sectionTabs.length || !sectionPanels.length) return;
		activeDetailSection = section;
		for (const tab of sectionTabs) {
			const isActive = tab.dataset.ucmSection === section;
			tab.classList.toggle("is-active", isActive);
			tab.setAttribute("aria-selected", isActive ? "true" : "false");
			tab.tabIndex = isActive ? 0 : -1;
		}
		for (const panel of sectionPanels) panel.hidden = panel.dataset.ucmSectionPanel !== section;
	}
	function buildPanelShell(innerHTML, view = "list", chainId = "") {
		return `
    <button id="ucm-chain-panel-button" class="ucm-floating-button" type="button" aria-haspopup="dialog">
      Chain Manager
    </button>
    <div id="ucm-chain-panel-shell" class="ucm-panel-shell" data-ucm-view="${view}" data-chain-id="${chainId}" hidden>
      <div class="ucm-panel-backdrop" data-ucm-close="panel"></div>
      <div class="ucm-panel" role="dialog" aria-modal="true">
        <div class="ucm-panel-hero u-flex u-items-start u-justify-between u-gap-ucm-2">
          <div>
            <p class="ucm-panel-kicker">Chain Manager</p>
            <h2>UCM</h2>
          </div>
          <div class="u-flex u-gap-2">
            <button id="ucm-chain-panel-diagnostics" class="ucm-modal-close" type="button" aria-label="Diagnostics" title="Diagnostics">i</button>
            <button id="ucm-chain-panel-refresh" class="ucm-modal-close" type="button" aria-label="Refresh" title="Refresh">\u21BB</button>
            <button id="ucm-chain-panel-close" class="ucm-modal-close" type="button" aria-label="Close">\u00D7</button>
          </div>
        </div>
        ${innerHTML}
        <p id="ucm-chain-panel-status" class="ucm-modal-status" aria-live="polite"></p>
      </div>
      <div id="ucm-command-modal" class="ucm-command-modal" hidden>
        <div class="ucm-command-modal-backdrop" data-ucm-close-command="1"></div>
        <div class="ucm-command-modal-card" role="dialog" aria-modal="true" aria-labelledby="ucm-command-modal-title">
          <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
            <h3 id="ucm-command-modal-title">Command</h3>
            <button id="ucm-command-modal-close" class="ucm-modal-close" type="button" aria-label="Close">\u00D7</button>
          </div>
          <form id="ucm-command-modal-form">
            <div id="ucm-command-modal-body" class="ucm-command-modal-body"></div>
            <div class="ucm-command-modal-actions">
              <button id="ucm-command-modal-cancel" class="ucm-secondary-button" type="button">Cancel</button>
              <button id="ucm-command-modal-submit" type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
	}
	function formatPlatformValue(value) {
		if (value === true) return "yes";
		if (value === false) return "no";
		if (value == null || value === "") return "—";
		return String(value);
	}
	function buildDiagnosticsHTML() {
		const platform = getPlatformInfo();
		const entries = getDiagnosticsEntries().slice(-80).reverse();
		return `
    <div class="ucm-panel-toolbar u-flex u-items-start u-justify-between u-gap-ucm-2 u-flex-wrap">
      <button id="ucm-back-to-chains-secondary" class="ucm-secondary-button" type="button">\u2190 Chains</button>
      <span class="ucm-status-pill">Diagnostics</span>
    </div>
    <section class="ucm-subsection-card">
      <div class="u-flex u-items-center u-justify-between u-gap-ucm-2 u-flex-wrap">
        <h3>Diagnostics</h3>
        <div class="u-flex u-gap-2">
          <button id="ucm-diagnostics-copy" class="ucm-secondary-button" type="button">Copy</button>
          <button id="ucm-diagnostics-clear" class="ucm-secondary-button" type="button">Clear</button>
        </div>
      </div>
      <div class="ucm-diagnostics-grid">
        ${[
			["Platform", platform.platform],
			["Backend", platform.backendUrl],
			["Script", platform.scriptVersion],
			["Transport", platform.lastTransport],
			["SSE", platform.sseStatus],
			["Session", platform.hasSessionToken ? `present (${platform.sessionTokenLength})` : "missing"],
			["Member", platform.memberId],
			["Faction", platform.factionId],
			["PDA GET", platform.hasPdaGet],
			["PDA POST", platform.hasPdaPost],
			["GM XHR", platform.hasGmXmlHttpRequest || platform.hasGmNamespaceRequest],
			["Fetch", platform.hasFetch]
		].map(([label, value]) => `
    <div class="ucm-diagnostics-kv">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatPlatformValue(value))}</strong>
    </div>
  `).join("")}
      </div>
    </section>
    <section class="ucm-subsection-card">
      <h4>Recent Events</h4>
      <div class="ucm-diagnostics-log">
        ${entries.length ? entries.map((entry) => {
			const time = entry.ts ? new Date(entry.ts).toLocaleTimeString() : "";
			const details = entry.details === void 0 ? "" : `<code>${escapeHtml(JSON.stringify(entry.details))}</code>`;
			return `
      <div class="ucm-diagnostics-entry ucm-diagnostics-entry-${escapeHtml(entry.level)}">
        <span>${escapeHtml(time)}</span>
        <b>${escapeHtml(entry.area)}</b>
        <p>${escapeHtml(entry.message)}</p>
        ${details}
      </div>
    `;
		}).join("") : "<p class=\"ucm-section-copy\">No diagnostics recorded yet.</p>"}
      </div>
    </section>
  `;
	}
	function commandButton(action, icon, label, description, danger = false) {
		return `
    <button class="ucm-command-row${danger ? " is-danger" : ""}" data-ucm-command="${action}" type="button">
      <span class="ucm-command-icon" aria-hidden="true">${icon}</span>
      <span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(description)}</small>
      </span>
    </button>
  `;
	}
	function buildCommandList(chain, canLead) {
		if (!canLead) return "";
		if (chain.status === "active") return `
      <div class="ucm-command-list">
        ${commandButton("hold", "⏸", "Hold All", "Pause hits and optionally block attacks.")}
        ${commandButton("release", "▶", "Release All", "Return the chain to free command mode.")}
        ${commandButton("pass", "🎫", "Issue Pass", "Let one member bypass the current block briefly.")}
        ${commandButton("target", "◎", "Assign Target", "Assign a hit and optional lock mode to a member.")}
        ${commandButton("watchlist", "☆", "Add Watchlist", "Track a target for chain leaders.")}
        ${commandButton("end", "✕", "End Chain", "Complete or cancel this chain.", true)}
      </div>
    `;
		if (chain.status === "scheduled") return `
      <div class="ucm-command-list">
        ${commandButton("start", "▶", "Start Chain", "Move this scheduled chain to active.")}
        ${commandButton("cancel", "✕", "Cancel Chain", "Cancel this scheduled chain.", true)}
      </div>
    `;
		return "";
	}
	async function buildOnlineMembersHTML(chainId, chain, canLead, canViewOverwatch) {
		if (!chainId || !["active", "forming"].includes(chain.status)) return "";
		if (!canLead && !canViewOverwatch) return "";
		try {
			const data = await listMembers(chainId);
			const sorted = (Array.isArray(data?.members) ? data.members : []).sort((a, b) => Number(b.isOnline) - Number(a.isOnline) || String(a.playerName || "").localeCompare(String(b.playerName || "")));
			if (sorted.length === 0) return `
        <section class="ucm-member-section">
          <h4>Online Members</h4>
          <p class="ucm-section-copy">No active faction members found.</p>
        </section>
      `;
			const cards = sorted.map((member) => `
      <article class="ucm-member-card${member.isOnline ? " is-online" : ""}">
        <div class="ucm-member-card-header">
          <div>
            <strong>${escapeHtml(member.playerName || member.tornUserId || "Unknown")}</strong>
            <span>${escapeHtml(presenceLabel(member))} · ${escapeHtml(formatRelativeTime(member.lastSeenAt))}</span>
          </div>
          <span class="ucm-presence-dot" aria-hidden="true"></span>
        </div>
        <div class="ucm-member-stat-grid">
          <span><small>Energy</small><b>${escapeHtml(formatEnergy(member))}</b></span>
          <span><small>Health</small><b>${escapeHtml(formatHealth(member))}</b></span>
          <span><small>Drug CD</small><b>${escapeHtml(member.drugCooldown || "—")}</b></span>
          <span><small>Status</small><b>${member.underAttackFlag ? "Under attack" : member.hospitalUntil ? "Hospital" : "Ready"}</b></span>
        </div>
        ${canLead ? `
          <button
            class="ucm-secondary-button ucm-member-command"
            data-ucm-command="pass"
            data-member-id="${escapeHtml(member.id)}"
            data-member-name="${escapeHtml(member.playerName || "")}"
            type="button"
          >Issue Command</button>
        ` : ""}
      </article>
    `).join("");
			return `
      <section class="ucm-member-section">
        <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
          <h4>Online Members</h4>
          <span class="ucm-status-pill">${sorted.filter((member) => member.isOnline).length} online</span>
        </div>
        <div class="ucm-member-grid">
          ${cards}
        </div>
      </section>
    `;
		} catch (error) {
			return `
      <section class="ucm-member-section">
        <h4>Online Members</h4>
        <p class="ucm-state-note">Unable to load member presence: ${escapeHtml(error?.message || "Unknown error")}</p>
      </section>
    `;
		}
	}
	async function renderChainDetailHTML(chainId) {
		const chain = (await getChain(chainId))?.chain;
		if (!chain) return buildPanelShell(`
      <div class="ucm-empty-state">
        <strong>Chain not found</strong>
        <p>This chain may have been deleted.</p>
      </div>
      <button id="ucm-back-to-chains" class="ucm-secondary-button" type="button">Back to Chains</button>
    `, "detail", chainId);
		const canLead = state.permissions.includes("chain.lead");
		const canViewOverwatch = state.permissions.includes("overwatch.view");
		const commandsHTML = buildCommandList(chain, canLead);
		const membersHTML = await buildOnlineMembersHTML(chainId, chain, canLead, canViewOverwatch);
		const summaryHTML = `
    <div class="ucm-chain-summary u-grid u-gap-3">
      <div class="ucm-summary-grid u-grid u-grid-cols-2 u-gap-3">
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Status</span>
          <strong>${escapeHtml(chain.status || "unknown")}</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Scheduled</span>
          <strong>${formatDate(chain.scheduledStartUtc)}</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Duration</span>
          <strong>${chain.expectedDurationMinutes || "—"}m</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Mode</span>
          <strong>${chain.warMode ? "War" : "Normal"}</strong>
        </div>
      </div>
      ${chain.notes ? `<pre class="ucm-summary-notes">${escapeHtml(chain.notes)}</pre>` : ""}
    </div>
  `;
		const existingRsvp = state.rsvps[chainId] || null;
		let rsvpHTML;
		if (existingRsvp) rsvpHTML = `
      <div class="ucm-subsection-card">
        <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
          <h4>RSVP</h4>
          <button id="ucm-rsvp-edit" class="ucm-secondary-button" type="button">Edit</button>
        </div>
        <div class="ucm-summary-grid u-grid u-grid-cols-2 u-gap-3">
          <div class="ucm-summary-item">
            <span class="ucm-summary-label">Response</span>
            <strong>${escapeHtml({
			yes: "Yes",
			maybe: "Maybe",
			no: "No"
		}[existingRsvp.response] || existingRsvp.response)}</strong>
          </div>
          <div class="ucm-summary-item">
            <span class="ucm-summary-label">Late</span>
            <strong>${existingRsvp.lateMinutes ? existingRsvp.lateMinutes + "m" : "—"}</strong>
          </div>
        </div>
        ${existingRsvp.note ? `<p class="ucm-state-note">${escapeHtml(existingRsvp.note)}</p>` : ""}
      </div>
    `;
		else rsvpHTML = `
      <div class="ucm-subsection-card">
        <h4>RSVP</h4>
        <form id="ucm-rsvp-form">
          <div class="ucm-form-grid u-grid u-gap-3">
            <div>
              <label for="ucm-rsvp-response">Response</label>
              <select id="ucm-rsvp-response" name="response" required>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label for="ucm-rsvp-late">Late (minutes)</label>
              <input id="ucm-rsvp-late" name="lateMinutes" type="number" min="0" placeholder="0" />
            </div>
            <div class="u-col-span-full">
              <label for="ucm-rsvp-note">Note</label>
              <input id="ucm-rsvp-note" name="note" type="text" maxlength="200" placeholder="Optional" />
            </div>
          </div>
          <button type="submit" class="u-mt-ucm-2">Save RSVP</button>
        </form>
      </div>
    `;
		const primaryContent = `
    <div data-ucm-section-panel="primary" class="ucm-detail-section">
      <div class="ucm-detail-stack u-grid u-gap-3">
        ${summaryHTML}
        ${rsvpHTML}
        ${membersHTML}
      </div>
    </div>
  `;
		const advancedContent = commandsHTML ? `
    <div data-ucm-section-panel="advanced" class="ucm-detail-section" hidden>
      <div class="ucm-detail-stack u-grid u-gap-3">
        <div class="ucm-subsection-card">
          <h4>Commands</h4>
          ${commandsHTML}
        </div>
      </div>
    </div>
  ` : "";
		const tabsHTML = commandsHTML ? `
    <div class="ucm-detail-switcher u-grid u-grid-cols-2 u-gap-ucm-2">
      <button class="ucm-detail-tab is-active" data-ucm-section="primary" type="button" role="tab" aria-selected="true">Overview</button>
      <button class="ucm-detail-tab" data-ucm-section="advanced" type="button" role="tab" aria-selected="false" tabindex="-1">Commands</button>
    </div>
  ` : "";
		return buildPanelShell(`
    <div class="ucm-panel-toolbar u-flex u-items-start u-justify-between u-gap-ucm-2 u-flex-wrap">
      <button id="ucm-back-to-chains-secondary" class="ucm-secondary-button" type="button">\u2190 Chains</button>
      <span class="ucm-status-pill">${escapeHtml(chain.status || "unknown")}</span>
    </div>
    <h3>${escapeHtml(chain.title || "Untitled Chain")}</h3>
    ${tabsHTML}
    ${primaryContent}
    ${advancedContent}
  `, "detail", chainId);
	}
	async function renderIntoRoot(html) {
		if (!document.body) return null;
		let root = document.getElementById(CHAIN_PANEL_ROOT_ID);
		if (!root) {
			root = document.createElement("div");
			root.id = CHAIN_PANEL_ROOT_ID;
			document.body.appendChild(root);
		}
		const previousShell = document.getElementById("ucm-chain-panel-shell");
		const wasOpen = previousShell ? !previousShell.hidden : false;
		root.innerHTML = html;
		delete root.dataset.ucmBound;
		const nextShell = document.getElementById("ucm-chain-panel-shell");
		if (nextShell) nextShell.hidden = !wasOpen;
		return root;
	}
	async function renderListView() {
		return renderIntoRoot(buildPanelShell(await renderChainListHTML(), "list"));
	}
	async function renderCreateView() {
		return renderIntoRoot(buildPanelShell(renderChainCreateHTML(), "create"));
	}
	async function renderDetailView(chainId) {
		return renderIntoRoot(await renderChainDetailHTML(chainId));
	}
	async function renderDiagnosticsView() {
		return renderIntoRoot(buildPanelShell(buildDiagnosticsHTML(), "diagnostics"));
	}
	async function renderDefaultView() {
		let current;
		try {
			current = await getCurrentChain();
		} catch (error) {
			logDiagnostic("warn", "ui", "unable to load current chain for default view", { message: error?.message || "unknown error" });
			return renderListView();
		}
		const liveStatuses = new Set([
			"active",
			"forming",
			"scheduled"
		]);
		const currentChain = current?.chain;
		if (currentChain?.id && liveStatuses.has(currentChain.status)) {
			activeDetailSection = DEFAULT_DETAIL_SECTION;
			try {
				return await renderDetailView(currentChain.id);
			} catch (error) {
				logDiagnostic("warn", "ui", "unable to render current chain detail; falling back to chain list", {
					chainId: currentChain.id,
					status: currentChain.status,
					message: error?.message || "unknown error"
				});
				return renderListView();
			}
		}
		return renderListView();
	}
	function closePanel() {
		const { shell, button } = getElements();
		if (!shell) return;
		shell.hidden = true;
		button?.focus();
	}
	function closeCommandModal() {
		const { commandModal, commandModalBody, commandModalForm } = getElements();
		if (!commandModal) return;
		commandModal.hidden = true;
		if (commandModalBody) commandModalBody.innerHTML = "";
		commandModalForm?.removeAttribute("data-command-action");
	}
	function modalFields(action, defaults = {}) {
		const memberId = escapeHtml(defaults.memberId || "");
		const memberName = escapeHtml(defaults.memberName || "");
		switch (action) {
			case "hold": return `
        <input type="hidden" name="action" value="hold" />
        <label for="ucm-modal-hold-reason">Reason</label>
        <input id="ucm-modal-hold-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
        <label class="ucm-checkbox-row" for="ucm-modal-hold-block">
          <input id="ucm-modal-hold-block" name="blockAttackButton" type="checkbox" checked />
          <span>Block attack button</span>
        </label>
      `;
			case "release": return `
        <input type="hidden" name="action" value="release" />
        <label for="ucm-modal-release-reason">Reason</label>
        <input id="ucm-modal-release-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "pass": return `
        <input type="hidden" name="action" value="pass" />
        ${memberName ? `<p class="ucm-state-note">Issuing pass for ${memberName}</p>` : ""}
        <label for="ucm-modal-pass-member">Member ID</label>
        <input id="ucm-modal-pass-member" name="memberId" type="text" value="${memberId}" required />
        <label for="ucm-modal-pass-ttl">TTL (seconds)</label>
        <input id="ucm-modal-pass-ttl" name="ttlSeconds" type="number" min="10" value="45" required />
        <label for="ucm-modal-pass-reason">Reason</label>
        <input id="ucm-modal-pass-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "target": return `
        <input type="hidden" name="action" value="target" />
        <label for="ucm-modal-target-assignee">Assignee Member ID</label>
        <input id="ucm-modal-target-assignee" name="assigneeMemberId" type="text" value="${memberId}" required />
        <label for="ucm-modal-target-enemy">Enemy Torn User ID</label>
        <input id="ucm-modal-target-enemy" name="enemyTornUserId" type="number" min="1" required />
        <label for="ucm-modal-target-hit">Hit Number</label>
        <input id="ucm-modal-target-hit" name="hitNumber" type="number" min="1" required />
        <label for="ucm-modal-target-lock">Lock Mode</label>
        <select id="ucm-modal-target-lock" name="lockMode">
          <option value="target_only">Target Only</option>
          <option value="bonus_hit_lock">Bonus Hit Lock</option>
        </select>
        <label for="ucm-modal-target-note">Note</label>
        <input id="ucm-modal-target-note" name="note" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "watchlist": return `
        <input type="hidden" name="action" value="watchlist" />
        <label for="ucm-modal-wl-enemy">Enemy Torn User ID</label>
        <input id="ucm-modal-wl-enemy" name="enemyTornUserId" type="number" min="1" required />
        <label for="ucm-modal-wl-label">Label</label>
        <input id="ucm-modal-wl-label" name="label" type="text" maxlength="120" placeholder="Optional" />
        <label for="ucm-modal-wl-priority">Priority</label>
        <input id="ucm-modal-wl-priority" name="priority" type="number" min="1" value="100" />
      `;
			case "start": return "<input type=\"hidden\" name=\"action\" value=\"start\" /><p class=\"ucm-section-copy\">Start this chain now and open the live event stream.</p>";
			case "cancel": return `
        <input type="hidden" name="action" value="cancel" />
        <label for="ucm-modal-cancel-reason">Reason</label>
        <input id="ucm-modal-cancel-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "end": return `
        <input type="hidden" name="action" value="end" />
        <label for="ucm-modal-end-outcome">Outcome</label>
        <select id="ucm-modal-end-outcome" name="outcome">
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label for="ucm-modal-end-reason">Reason</label>
        <input id="ucm-modal-end-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			default: return "";
		}
	}
	function openCommandModal(action, defaults = {}) {
		const { commandModal, commandModalBody, commandModalTitle, commandModalForm } = getElements();
		if (!commandModal || !commandModalBody || !commandModalForm) return;
		commandModalTitle.textContent = {
			hold: "Hold All",
			release: "Release All",
			pass: "Issue Pass",
			target: "Assign Target",
			watchlist: "Add Watchlist",
			start: "Start Chain",
			cancel: "Cancel Chain",
			end: "End Chain"
		}[action] || "Command";
		commandModalForm.dataset.commandAction = action;
		commandModalBody.innerHTML = modalFields(action, defaults);
		commandModal.hidden = false;
		commandModal.querySelector("input:not([type=\"hidden\"]), select, button")?.focus();
	}
	async function openPanel() {
		try {
			if (getCurrentView() === "detail" && getCurrentChainId()) await renderDetailView(getCurrentChainId());
			else if (getCurrentView() === "create") await renderCreateView();
			else await renderDefaultView();
			const { shell } = getElements();
			if (shell) shell.hidden = false;
			bindEvents(true);
		} catch (error) {
			logDiagnostic("error", "ui", "unable to open chain panel", { message: error?.message || "unknown error" });
		}
	}
	async function refreshCurrentView() {
		const currentView = getCurrentView();
		if (currentView === "create") await renderCreateView();
		else if (currentView === "detail" && getCurrentChainId()) await renderDetailView(getCurrentChainId());
		else await renderListView();
		const { shell } = getElements();
		if (shell) shell.hidden = false;
		bindEvents(true);
	}
	async function refreshAfterAction(message = "", view = "detail", chainId = "") {
		if (view === "list") await renderListView();
		else if (view === "create") await renderCreateView();
		else if (chainId) await renderDetailView(chainId);
		else await renderListView();
		const { shell } = getElements();
		if (shell) shell.hidden = false;
		bindEvents(true);
		if (message) showNotification(message);
	}
	async function submitCreate(event) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		setChainPanelStatus("Creating chain...");
		try {
			const response = await submitChainCreate(data);
			activeDetailSection = DEFAULT_DETAIL_SECTION;
			await refreshAfterAction("Chain created.", "detail", response?.chain?.id || "");
		} catch (error) {
			setChainPanelStatus(error?.message || "Unable to create chain.", "error");
		}
	}
	async function submitRSVP(event) {
		event.preventDefault();
		const chainId = getCurrentChainId();
		if (!chainId) {
			setChainPanelStatus("No chain selected.", "error");
			return;
		}
		const data = new FormData(event.currentTarget);
		const lateValue = String(data.get("lateMinutes") || "").trim();
		setChainPanelStatus("Saving RSVP...");
		const payload = {
			response: String(data.get("response") || ""),
			lateMinutes: lateValue ? Number(lateValue) : null,
			note: String(data.get("note") || "").trim() || null
		};
		try {
			await rsvp(chainId, payload);
			state.rsvps[chainId] = payload;
			await refreshAfterAction("RSVP saved.", "detail", chainId);
		} catch (error) {
			setChainPanelStatus(error?.message || "Unable to save RSVP.", "error");
		}
	}
	async function submitCommandModal(event) {
		event.preventDefault();
		const chainId = getCurrentChainId();
		if (!chainId) {
			setChainPanelStatus("No chain selected.", "error");
			return;
		}
		const form = event.currentTarget;
		const data = new FormData(form);
		const action = form.dataset.commandAction || String(data.get("action") || "");
		setChainPanelStatus("Submitting command...");
		try {
			if (action === "hold") {
				await holdAll(chainId, {
					reason: String(data.get("reason") || "").trim(),
					blockAttackButton: data.get("blockAttackButton") === "on"
				});
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Hold all applied.", "detail", chainId);
				return;
			}
			if (action === "release") {
				await releaseAll(chainId, { reason: String(data.get("reason") || "").trim() });
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Released hold.", "detail", chainId);
				return;
			}
			if (action === "pass") {
				await issuePass(chainId, {
					memberId: String(data.get("memberId") || ""),
					ttlSeconds: Number(data.get("ttlSeconds")) || 45,
					reason: String(data.get("reason") || "").trim() || null
				});
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Pass issued.", "detail", chainId);
				return;
			}
			if (action === "target") {
				await assignTarget(chainId, {
					assigneeMemberId: String(data.get("assigneeMemberId") || ""),
					enemyTornUserId: Number(data.get("enemyTornUserId")),
					hitNumber: Number(data.get("hitNumber")),
					lockMode: String(data.get("lockMode") || "target_only"),
					note: String(data.get("note") || "").trim() || null
				});
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Target assigned.", "detail", chainId);
				return;
			}
			if (action === "watchlist") {
				await addWatchlistEntry(chainId, {
					enemyTornUserId: Number(data.get("enemyTornUserId")),
					label: String(data.get("label") || "").trim() || null,
					priority: Number(data.get("priority")) || 100
				});
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Watchlist entry added.", "detail", chainId);
				return;
			}
			if (action === "start") {
				await startChain(chainId);
				connectSSE(handleEvent);
				activeDetailSection = DEFAULT_DETAIL_SECTION;
				closeCommandModal();
				await refreshAfterAction("Chain started.", "detail", chainId);
				return;
			}
			if (action === "cancel" || action === "end") {
				const outcome = action === "cancel" ? "cancelled" : String(data.get("outcome") || "completed");
				await endChain(chainId, {
					outcome,
					reason: String(data.get("reason") || "").trim() || null
				});
				disconnectSSE();
				closeCommandModal();
				await refreshAfterAction(`Chain ${outcome}.`, "list");
				return;
			}
			throw new Error("Unknown command.");
		} catch (error) {
			setChainPanelStatus(error?.message || "Unable to submit command.", "error");
		}
	}
	function bindEvents(force = false) {
		const { root, button, close, refresh, diagnostics, addChain, back, backSecondary, createForm, rsvpForm, rsvpEdit, commandButtons, commandModal, commandModalClose, commandModalCancel, commandModalForm, chainButtons, shell, sectionTabs } = getElements();
		if (!root || !force && root.dataset.ucmBound === "1") return;
		root.dataset.ucmBound = "1";
		button?.addEventListener("click", openPanel);
		close?.addEventListener("click", closePanel);
		refresh?.addEventListener("click", async () => {
			try {
				if (getCurrentView() === "diagnostics") {
					await renderDiagnosticsView();
					const { shell: nextShell } = getElements();
					if (nextShell) nextShell.hidden = false;
					bindEvents(true);
				} else await refreshCurrentView();
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to refresh view.", "error");
			}
		});
		diagnostics?.addEventListener("click", async () => {
			try {
				await renderDiagnosticsView();
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to open diagnostics.", "error");
			}
		});
		addChain?.addEventListener("click", async () => {
			try {
				await renderCreateView();
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to open create view.", "error");
			}
		});
		const backToList = async () => {
			try {
				await renderListView();
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to return to chains.", "error");
			}
		};
		back?.addEventListener("click", backToList);
		backSecondary?.addEventListener("click", backToList);
		document.getElementById("ucm-diagnostics-clear")?.addEventListener("click", async () => {
			clearDiagnostics();
			logDiagnostic("info", "diagnostics", "diagnostics cleared");
			await renderDiagnosticsView();
			const { shell: nextShell } = getElements();
			if (nextShell) nextShell.hidden = false;
			bindEvents(true);
		});
		document.getElementById("ucm-diagnostics-copy")?.addEventListener("click", async () => {
			const text = serializeDiagnostics();
			try {
				await navigator.clipboard.writeText(text);
				setChainPanelStatus("Diagnostics copied.", "success");
				logDiagnostic("ok", "diagnostics", "diagnostics copied");
			} catch (error) {
				setChainPanelStatus("Unable to copy diagnostics. Use console __UCM_DIAGNOSTICS__.text().", "error");
				logDiagnostic("warn", "diagnostics", "diagnostics copy failed", { message: error?.message || "unknown error" });
			}
		});
		for (const chainButton of chainButtons) chainButton.addEventListener("click", async () => {
			try {
				activeDetailSection = DEFAULT_DETAIL_SECTION;
				await renderDetailView(chainButton.dataset.chainId);
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to load chain.", "error");
			}
		});
		for (const tab of sectionTabs) tab.addEventListener("click", () => {
			applyDetailSection(tab.dataset.ucmSection || DEFAULT_DETAIL_SECTION);
		});
		for (const commandButtonEl of commandButtons) commandButtonEl.addEventListener("click", () => {
			openCommandModal(commandButtonEl.dataset.ucmCommand, {
				memberId: commandButtonEl.dataset.memberId || "",
				memberName: commandButtonEl.dataset.memberName || ""
			});
		});
		createForm?.addEventListener("submit", submitCreate);
		rsvpForm?.addEventListener("submit", submitRSVP);
		rsvpEdit?.addEventListener("click", () => {
			const chainId = getCurrentChainId();
			if (chainId) {
				delete state.rsvps[chainId];
				refreshCurrentView();
			}
		});
		commandModalForm?.addEventListener("submit", submitCommandModal);
		commandModalClose?.addEventListener("click", closeCommandModal);
		commandModalCancel?.addEventListener("click", closeCommandModal);
		commandModal?.addEventListener("click", (event) => {
			if (event.target instanceof HTMLElement && event.target.dataset.ucmCloseCommand === "1") closeCommandModal();
		});
		shell?.addEventListener("click", (event) => {
			if (event.target instanceof HTMLElement && event.target.dataset.ucmClose === "panel") closePanel();
		});
		if (getCurrentView() === "detail") applyDetailSection(activeDetailSection);
	}
	async function initChainPanel() {
		const root = await renderIntoRoot(buildPanelShell(`
    <div class="ucm-empty-state">
      <strong>Loading UCM</strong>
      <p>Preparing chain controls.</p>
    </div>
  `, "loading"));
		bindEvents(true);
		if (!hasAnyChainControlPermission()) {
			logDiagnostic("warn", "ui", "chain panel opened without chain-control permissions", {
				permissionCount: Array.isArray(state.permissions) ? state.permissions.length : 0,
				permissions: Array.isArray(state.permissions) ? state.permissions : []
			});
			await renderIntoRoot(buildPanelShell(`
      <div class="ucm-empty-state">
        <strong>UCM active</strong>
        <p>No chain-control permissions are available in this session.</p>
      </div>
      ${buildDiagnosticsHTML()}
    `, "diagnostics"));
			bindEvents(true);
			return document.getElementById(CHAIN_PANEL_ROOT_ID);
		}
		try {
			const nextRoot = await renderDefaultView();
			if (!nextRoot) return root;
			bindEvents(true);
			return nextRoot;
		} catch (error) {
			logDiagnostic("error", "ui", "unable to render chain panel", { message: error?.message || "unknown error" });
			await renderIntoRoot(buildPanelShell(`
      <div class="ucm-empty-state">
        <strong>UCM panel error</strong>
        <p>${escapeHtml(error?.message || "Unable to render chain controls.")}</p>
      </div>
      ${buildDiagnosticsHTML()}
    `, "diagnostics"));
			bindEvents(true);
			return document.getElementById(CHAIN_PANEL_ROOT_ID);
		}
	}
	//#endregion
	//#region src/dom/mutation-observer.js
	var observer = null;
	var debounceTimer = null;
	var isApplying = false;
	/**
	* Initialize the MutationObserver to re-apply attack button state
	* after React re-renders.
	*/
	function initMutationObserver() {
		const target = document.getElementById("react-root") || document.body;
		observer = new MutationObserver(() => {
			if (isApplying) return;
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				isApplying = true;
				try {
					reapplyIfNeeded(isBlocked());
				} finally {
					isApplying = false;
				}
			}, CONFIG.MUTATION_OBSERVER_DEBOUNCE_MS);
		});
		observer.observe(target, {
			childList: true,
			subtree: true
		});
	}
	//#endregion
	//#region src/main.js
	/**
	* UCM Userscript Entry Point
	*
	* Initialization sequence:
	* 1. Load session from localStorage
	* 2. Inject styles
	* 3. Connect SSE for real-time events
	* 4. Initialize MutationObserver
	*/
	(function ucmInit() {
		"use strict";
		if (window.__UCM_INITIALIZED__) return;
		window.__UCM_INITIALIZED__ = true;
		logDiagnostic("info", "startup", "Ultimate Chain Manager initializing", {
			href: window.location.href,
			readyState: document.readyState,
			backendUrl: CONFIG.BACKEND_URL,
			isTopWindow: window.top === window.self
		});
		state.sessionToken = normalizeSessionToken(storageGet(CONFIG.STORAGE.SESSION_TOKEN));
		state.memberId = storageGet(CONFIG.STORAGE.MEMBER_ID);
		state.factionId = storageGet(CONFIG.STORAGE.FACTION_ID);
		const storedPerms = storageGet(CONFIG.STORAGE.PERMISSIONS);
		if (storedPerms) try {
			state.permissions = JSON.parse(storedPerms);
		} catch (e) {
			logDiagnostic("warn", "startup", "failed to parse stored permissions JSON; resetting permissions", { error: e?.message || "unknown" });
			state.permissions = [];
		}
		logDiagnostic("info", "startup", "session bootstrap state", {
			hasSessionToken: hasValidSessionToken(state.sessionToken),
			sessionTokenLength: state.sessionToken?.length || 0,
			memberId: state.memberId || null,
			factionId: state.factionId || null,
			permissionCount: state.permissions.length
		});
		updatePostHogUserContext({
			memberId: state.memberId,
			factionId: state.factionId,
			permissionCount: state.permissions.length
		});
		injectStyles();
		if (!hasValidSessionToken(state.sessionToken)) {
			logDiagnostic("info", "startup", "no valid session found; enabling onboarding prompt", {
				href: window.location.href,
				hasSessionToken: false,
				isTopWindow: window.top === window.self
			});
			initOnboardingRouteWatcherForTornPda();
			return;
		}
		if (window.top !== window.self) {
			logDiagnostic("info", "startup", "session found, but skipping active controls in embedded context");
			return;
		}
		installAttackClickGuard(isBlocked);
		getCurrentChain().then((data) => {
			const chain = data?.chain || null;
			state.currentChain = chain;
			state.currentChainId = chain?.id || null;
			state.commandMode = chain?.commandMode || "free";
			initChainPanel().finally(() => {
				if (chain?.status === "active") connectSSE(handleEvent);
				else logDiagnostic("info", "sse", "SSE stream deferred until a chain is active", { currentChainStatus: chain?.status || null });
			});
			initMutationObserver();
			if (isAttackPage()) reapplyIfNeeded(isBlocked());
			logDiagnostic("ok", "startup", "initialized successfully");
		}).catch((error) => {
			logDiagnostic("error", "startup", "unable to sync current chain state", { message: error?.message || "unknown error" });
			initChainPanel();
			initMutationObserver();
			if (isAttackPage()) reapplyIfNeeded(isBlocked());
		});
	})();
	//#endregion
})();

(function() {	try {		if (typeof document != "undefined") {			var elementStyle = document.createElement("style");			elementStyle.appendChild(document.createTextNode(".u-grid{display:grid;}.u-col-span-full{grid-column:1/-1;}.u-grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}.u-mt-ucm-2{margin-top:var(--ucm-space-2);}.u-mt-ucm-3{margin-top:var(--ucm-space-3);}.u-flex{display:flex;}.u-flex-col{flex-direction:column;}.u-flex-wrap{flex-wrap:wrap;}.u-items-start{align-items:flex-start;}.u-items-center{align-items:center;}.u-justify-between{justify-content:space-between;}.u-gap-2{gap:0.5rem;}.u-gap-3{gap:0.75rem;}.u-gap-ucm-2{gap:var(--ucm-space-2);}.u-gap-ucm-3{gap:var(--ucm-space-3);}/*$vite$:1*/"));			document.head.appendChild(elementStyle);		}	} catch (e) {		console.error("vite-plugin-css-injected-by-js", e);	}})();