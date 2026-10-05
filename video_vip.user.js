// ==UserScript==
// @name              全网VIP视频免费解析去广告【最新3.2】
// @namespace         video_vip
// @version           3.2.9.6
// @description       全网VIP视频免费破解去广告，支持爱奇艺、腾讯、优酷、芒果、哔哩哔哩等主流视频网站VIP视频解析，适配桌面端和移动端【脚本长期维护更新，完全免费，无广告，仅限学习交流！】
// @license           GPL-3.0 License
// @icon              https://cdn.jsdmirror.com/gh/88lin/picx-images-hosting@master/favicon.67xwxgc03y.svg
// @author            茉灵智库：https://blog.88lin.eu.org/article/46
// @include           *://v.qq.com/x/page/*
// @include           *://v.qq.com/x/cover/*
// @include           *://v.qq.com/tv/*
// @include           *://*.iqiyi.com/v_*
// @include           *://*.iqiyi.com/a_*
// @include           *://*.iqiyi.com/w_*
// @include           *://*.iq.com/play/*
// @include           *://*.youku.com/v_*
// @include           *://*.youku.com/video*
// @include           *://*.youku.com/*?vid=*
// @include           *://*.mgtv.com/b/*
// @include           *://*.tudou.com/v_*
// @include           *://tv.sohu.com/v/*
// @include           *://*.bilibili.com/video/*
// @include           *://*.bilibili.com/bangumi/play/*
// @include           *://v.pptv.com/show/*
// @include           *://vip.pptv.com/show/*
// @include           *://www.wasu.cn/Play/show/*
// @include           *://*.le.com/ptv/vplay/*
// @include           *://*.acfun.cn/v/*
// @include           *://*.acfun.cn/bangumi/*
// @include           *://*.1905.com/play/*
// @include           *://m.v.qq.com/x/m/*
// @include           *://m.v.qq.com/*
// @include           *://m.iqiyi.com/*
// @include           *://m.iqiyi.com/v_*
// @include           *://m.youku.com/video/*
// @include           *://m.youku.com/alipay_*
// @include           *://m.mgtv.com/b/*
// @include           *://m.tv.sohu.com/v/*
// @include           *://m.tv.sohu.com/album/*
// @include           *://m.pptv.com/show/*
// @include           *://m.bilibili.com/anime/*
// @include           *://m.bilibili.com/video/*
// @include           *://m.bilibili.com/bangumi/play/*
// @require           https://cdn.jsdmirror.com/npm/jquery@3.7.1/dist/jquery.min.js
// @connect           wsyzy.cc
// @connect           api.wsyzy.net
// @connect           free.maccms.xyz
// @connect           bfq.txnp.cn
// @connect           jx.202617.xyz
// @connect           json.fongmi.cc
// @connect           bd.jx.cn
// @connect           jx.hls.one
// @connect           jx.playerjy.com
// @grant             unsafeWindow
// @grant             GM_addStyle
// @grant             GM_openInTab
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_xmlhttpRequest
// @charset                   UTF-8
// @compatible        firefox
// @compatible        chrome
// @compatible        opera safari edge
// @downloadURL https://cdn.jsdmirror.com/gh/88lin/video_vip@main/video_vip.user.js
// @updateURL https://cdn.jsdmirror.com/gh/88lin/video_vip@main/video_vip.user.js
// ==/UserScript==

const util = (function () {
    let mediaCleanerStarted = false;
    let mediaPlayBlocked = false;

    function stopMedia(media) {
        if (!media) {
            return;
        }
        try {
            media.pause();
        } catch (e) {
        }
        try {
            media.autoplay = false;
            media.loop = false;
            media.muted = true;
            media.defaultMuted = true;
            media.volume = 0;
            media.playbackRate = 1;
            media.removeAttribute("autoplay");
            media.removeAttribute("src");
            media.srcObject = null;
            media.querySelectorAll("source").forEach((node) => node.remove());
            if (media.currentSrc || media.srcObject || media.querySelector("source")) {
                media.load();
            }
        } catch (e) {
        }
    }

    function mutePageMedia(root = document) {
        if (!root || !root.querySelectorAll) {
            return;
        }
        root.querySelectorAll("video, audio").forEach((media) => stopMedia(media));
    }

    function blockNativeMediaPlayback() {
        if (mediaPlayBlocked || !window.HTMLMediaElement) {
            return;
        }
        mediaPlayBlocked = true;
        const rawPlay = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
            stopMedia(this);
            return Promise.resolve();
        };
        document.addEventListener("play", (event) => {
            if (event.target instanceof HTMLMediaElement) {
                stopMedia(event.target);
            }
        }, true);
        document.addEventListener("playing", (event) => {
            if (event.target instanceof HTMLMediaElement) {
                stopMedia(event.target);
            }
        }, true);
        HTMLMediaElement.prototype.play.toString = () => rawPlay.toString();
    }

    function reomveVideo() {
        if (mediaCleanerStarted) {
            mutePageMedia();
            return;
        }
        mediaCleanerStarted = true;
        blockNativeMediaPlayback();
        mutePageMedia();
        setInterval(() => {
            mutePageMedia();
        }, 500);
        const target = document.documentElement || document.body;
        if (!target || !window.MutationObserver) {
            return;
        }
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.target instanceof Element) {
                    if (mutation.target.matches("video, audio")) {
                        stopMedia(mutation.target);
                        return;
                    }
                }
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) {
                        return;
                    }
                    if (node.matches && node.matches("video, audio")) {
                        stopMedia(node);
                        return;
                    }
                    mutePageMedia(node);
                });
            });
        });
        observer.observe(target, {childList: true, subtree: true, attributes: true, attributeFilter: ["src", "autoplay"]});
    }

    return {
        findTargetEle(selector) {
            return new Promise((resolve, reject) => {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                    return;
                }
                let tryTime = 0;
                const maxTryTime = 120;
                const timer = setInterval(() => {
                    const el = document.querySelector(selector);
                    if (el) {
                        clearInterval(timer);
                        resolve(el);
                        return;
                    }
                    if ((++tryTime) === maxTryTime) {
                        clearInterval(timer);
                        reject(new Error('findTargetEle timeout: ' + selector));
                    }
                }, 500);
            });
        },
        reomveVideo: () => reomveVideo(),
        // URL 变化监听（v3.2.9.4）：SPA 路由钩子即时响应 + 1s 轮询兜底
        // 注意：钩子必须以 href 实际变化为准 —— 站点会高频调用同址 pushState/replaceState
        // （框架路由/状态同步），无条件触发会把页面刷成死循环
        onUrlChange(cb) {
            let stopped = false;
            let lastHref = window.location.href;
            const fire = () => {
                if (stopped) return;
                const href = window.location.href;
                if (href === lastHref) return;
                lastHref = href;
                cb();
            };
            const hooks = [window.history];
            try {
                if (typeof unsafeWindow !== 'undefined' && unsafeWindow.history && unsafeWindow.history !== window.history) {
                    hooks.push(unsafeWindow.history);
                }
            } catch (e) {
            }
            hooks.forEach((h) => {
                ["pushState", "replaceState"].forEach((name) => {
                    try {
                        const raw = h[name];
                        if (typeof raw !== "function") return;
                        h[name] = function (...args) {
                            const ret = raw.apply(this, args);
                            fire();
                            return ret;
                        };
                    } catch (e) {
                    }
                });
            });
            window.addEventListener("popstate", fire);
            window.addEventListener("hashchange", fire);
            const timer = setInterval(fire, 1000);
            return () => { stopped = true; };
        }
    };
})();

const superVip = (function () {

    const _CONFIG_ = {
        isMobile: navigator.userAgent.match(/(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i),
        currentPlayerNode: null,
        vipBoxId: 'vip_jx_box' + Math.ceil(Math.random() * 100000000),
        iframeWrapperClass: 'vip_jx_iframe_wrapper',
        flag: "flag_vip",
        autoPlayerKey: "auto_player_key" + window.location.host,
        autoPlayerVal: "auto_player_value_" + window.location.host,
        directMode: false,
        manualPicked: false,
        // 当前解析接管状态（v3.2.9.4）：null=未接管 / 'direct'=无损云直连 / 'iframe'=接口内嵌
        // 重挂守卫据此判断"官网清掉了我们的播放器"后是否自动恢复
        parsedMode: null,
        lastSource: null,
        cleanupTimer: null,
        wsyzyFsbBound: false,
        fullscreenCleanupBound: false,
        videoParseList: [
            {"name": "无损云解析", "type": "1", "wsyzy": true},
            {"name": "麒麟解析", "type": "1,3", "url": "https://free.maccms.xyz/?url="},
            {"name": "TXNQ解析", "type": "1,3", "url": "https://bfq.txnp.cn/player?url="},
            {"name": "七哥解析", "type": "1,3", "url": "https://jx.202617.xyz/tv.php?url="},
            {"name": "fongmi解析", "type": "1,3", "url": "https://json.fongmi.cc/web?url="},
            {"name": "冰豆解析", "type": "1,3", "url": "https://bd.jx.cn/?url="},
                        {"name": "HLS解析", "type": "1,3", "url": "https://jx.hls.one/?url="},
            {"name": "Player-JY", "type": "1,3", "url": "https://jx.playerjy.com/?url="},
        ],
        playerContainers: [
            {
                host: "v.qq.com",
                container: "#mod_player,#player-container,.container-player",
                name: "Default",
                displayNodes: ["#mask_layer", ".mod_vip_popup", "#mask_layer", ".panel-tip-pay"]
            },
            {
                host: "m.v.qq.com",
                container: ".mod_player,#player",
                name: "Default",
                displayNodes: [".mod_vip_popup", "[class^=app_],[class^=app-],[class*=_app_],[class*=-app-],[class$=_app],[class$=-app]", "div[dt-eid=open_app_bottom]", "div.video_function.video_function_new", "a[open-app]", "section.mod_source", "section.mod_box.mod_sideslip_h.mod_multi_figures_h,section.mod_sideslip_privileges,section.mod_game_rec"]
            },

            {host: "w.mgtv.com", container: "#mgtv-player-wrap", name: "Default", displayNodes: []},
            {host: "www.mgtv.com", container: "#mgtv-player-wrap", name: "Default", displayNodes: []},
            {
                host: "m.mgtv.com",
                container: ".video-area",
                name: "Default",
                displayNodes: ["div.adFixedContain,div.ad-banner,div.m-list-graphicxcy.fstp-mark", "div[class^=mg-app],div#comment-id.video-comment div.ft,div.bd.clearfix,div.v-follower-info", "div.ht.mgui-btn.mgui-btn-nowelt", "div.personal", "div[data-v-41c9a64e]"]
            },
            {host: "www.bilibili.com", container: "#player_module,#bilibiliPlayer,#bilibili-player", name: "Default", displayNodes: []},
            {host: "m.bilibili.com", container: ".player-wrapper,.player-container,.mplayer", name: "Default", displayNodes: []},
            {host: "www.iqiyi.com", container: "#areaLeftContainer,#outlayer,.iqp-player-videolayer", name: "Default", displayNodes: ["#playerPopup", "#vipCoversBox" ,"div.iqp-player-vipmask", "div.iqp-player-paymask","div.iqp-player-loginmask", "div[class^=qy-header-login-pop]",".covers_cloudCover__ILy8R","#videoContent > div.loading_loading__vzq4j",".iqp-player-guide","#player-loading-layer",".player_outer_video"], cleanupNodes: ["#player-loading-layer",".player_outer_video"]},
            {
                host: "m.iqiyi.com",
                container: ".m-video-player-wrap, .iqp-player-videolayer",
                name: "Default",
                displayNodes: ["div.m-iqyGuide-layer", "a[down-app-android-url]", "div.iqp-player-vipmask", ".loading_loading__vzq4j","[name=m-extendBar]", "[class*=ChannelHomeBanner]", "section.m-hotWords-bottom"]
            },
            {host: "www.iq.com", container: ".intl-video-wrap", name: "Default", displayNodes: []},
            {host: "v.youku.com", container: ".player-container,#ykPlayer,#playerMouseWheel", name: "Default", displayNodes: ["#iframaWrapper","#video_side_cashier",".secondary-container.video_side_cashier_wrapper","#youku-dashboard"], cleanupNodes: ["#youku-dashboard > div.kui-dashboard-dashboard-panel","#youku-dashboard > div.kui-dashboard-dashboard-background","#youku-dashboard > div.kui-dashboard-bar-container","#youku-dashboard > div.kui-dashboard-timer-container","#video_side_cashier",".secondary-container.video_side_cashier_wrapper"]},
            {host: "m.youku.com", container: "#playerMouseWheel,.h5-detail-player", name: "Default", displayNodes: []},
            {host: "tv.sohu.com", container: "#player", name: "Default", displayNodes: []},
            {host: "film.sohu.com", container: "#playerWrap", name: "Default", displayNodes: []},
            {host: "www.le.com", container: "#le_playbox", name: "Default", displayNodes: []},
            {host: "video.tudou.com", container: ".td-playbox", name: "Default", displayNodes: []},
            {host: "v.pptv.com", container: "#pptv_playpage_box", name: "Default", displayNodes: []},
            {host: "vip.pptv.com", container: ".w-video", name: "Default", displayNodes: []},
            {host: "www.wasu.cn", container: "#flashContent", name: "Default", displayNodes: []},
            {host: "www.acfun.cn", container: "#player", name: "Default", displayNodes: []},
            {host: "vip.1905.com", container: "#player,#vodPlayer", name: "Default", displayNodes: []},
            {host: "www.1905.com", container: "#player,#vodPlayer", name: "Default", displayNodes: []},
        ]
    };

    // ===== 全屏自动隐藏浮窗（v3.2.9.1 本地补丁）=====
    // 背景：腾讯视频的两种全屏都盖不住浮窗——
    //   1) 真全屏是对根元素 <html> 调 requestFullscreen，整棵文档仍会渲染，浮窗照常置顶；
    //   2) 「网页全屏」是 CSS 伪全屏（.thumbplayer-fake-fullscreen，z-index 仅 9999），浮窗压在其上。
    // 策略：检测到这两种状态时把浮窗临时透明化并禁用交互，退出后恢复原状。
    function startFullscreenFloatGuard() {
        const shouldHide = () =>
            // 1) 根元素真全屏：全屏的是整个文档，浮窗会叠在全屏画面上（其他站点若也这么做，同样会被此条覆盖）
            document.fullscreenElement === document.documentElement ||
            // 2) 腾讯视频 CSS 伪全屏（网页全屏）：不触发 fullscreenchange，只能靠轮询捕获
            !!document.querySelector('.thumbplayer-fake-fullscreen');
        const sync = () => {
            // vipBoxId 为 vip_jx_box+随机数，且脚本重跑可能产生重复 id 的旧节点，统一按前缀收集
            const boxes = document.querySelectorAll('div[id^="vip_jx_box"]');
            if (!boxes.length) return;
            if (shouldHide()) {
                boxes.forEach((box) => {
                    box.style.setProperty('opacity', '0', 'important');
                    box.style.setProperty('pointer-events', 'none', 'important');
                });
            } else {
                // 恢复：直接移除内联覆盖，回落到样式表默认的 opacity:1 / pointer-events:auto
                boxes.forEach((box) => {
                    box.style.removeProperty('opacity');
                    box.style.removeProperty('pointer-events');
                });
            }
        };
        document.addEventListener('fullscreenchange', sync); // 真全屏进入/退出即时响应
        setInterval(sync, 300); // 伪全屏轮询兜底：一次类名查询开销极低
        sync();
    }

    function buildPlayerFrameLayout({isMobile, containerRect = {}, containerStyle = {}, viewportHeight = 0}) {
        const parsePixelValue = (value) => {
            const parsedValue = Number.parseFloat(value);
            return Number.isFinite(parsedValue) ? parsedValue : 0;
        };

        if (!isMobile) {
            return {
                containerStyles: {
                    overflow: "hidden"
                },
                wrapperStyles: {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    background: "#000",
                    overflow: "hidden",
                    zIndex: "2147483646"
                },
                iframeStyles: {
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                    background: "#000"
                }
            };
        }

        const width = parsePixelValue(containerRect.width);
        const height = parsePixelValue(containerRect.height);
        const paddingTop = parsePixelValue(containerStyle.paddingTop);
        const ratioHeight = width > 0 ? Math.round((width * 9) / 16) : 0;
        const fallbackViewportHeight = viewportHeight > 0 ? Math.round(viewportHeight * 0.32) : 180;
        const rawHeight = height || paddingTop || ratioHeight || fallbackViewportHeight;
        const maxHeight = viewportHeight > 0 ? Math.max(220, Math.round(viewportHeight * 0.7)) : rawHeight;
        const resolvedHeight = Math.max(180, Math.min(rawHeight, maxHeight));
        const usesPaddingAspect = width > 0 && paddingTop > 0 && (paddingTop / width) > 0.25;

        return {
            containerStyles: {
                overflow: "hidden",
                height: "auto",
                minHeight: `${resolvedHeight}px`,
                ...(usesPaddingAspect ? {paddingTop: "0"} : {})
            },
            wrapperStyles: {
                position: "relative",
                display: "block",
                width: "100%",
                minHeight: `${resolvedHeight}px`,
                aspectRatio: "16 / 9",
                background: "#000",
                overflow: "hidden",
                zIndex: "2147483646"
            },
            iframeStyles: {
                position: "absolute",
                inset: "0",
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
                background: "#000"
            }
        };
    }

    function applyInlineStyles(element, styles) {
        Object.entries(styles || {}).forEach(([propertyName, propertyValue]) => {
            if (propertyValue === undefined || propertyValue === null || propertyValue === "") {
                return;
            }
            element.style[propertyName] = propertyValue;
        });
    }

    const _SITE_NAMES = '爱奇艺|腾讯视频|腾讯|优酷|芒果TV|芒果|哔哩哔哩|bilibili|B站|搜狐视频|搜狐|乐视视频|乐视|PPTV聚力|PPTV|1905电影网|1905|土豆网|土豆|风行网|风行|西瓜视频|咪咕视频|咪咕|AcFun';
    const _SITE_NAME_RE = new RegExp('(?:^|[\\s\\-_：:|｜，,。·]+)(?:' + _SITE_NAMES + ')(?=$|[\\s\\-_：:|｜，,。·]+)', 'gi');
    const _SITE_LEAD_RE = new RegExp('^(?:' + _SITE_NAMES + ')+', 'i');
    const _SITE_TAIL_RE = new RegExp('(?:[\\s\\-_：:|｜]+|^)(?:' + _SITE_NAMES + ')$', 'i');
    const _SITE_WORD_RE = new RegExp('^(?:' + _SITE_NAMES + ')$', 'i');

    function wsyzyCleanTitle(t) {
        t = (t || '').replace(/[《》【】「」]/g, '')
            .replace(_SITE_NAME_RE, ' ')
            .replace(_SITE_LEAD_RE, '')
            .replace(_SITE_TAIL_RE, '')
            .replace(/在线观看|高清正版|免费观看|完整版|正片|预告|全集/g, '');
        const parts = t.split(/[-_\s（(|｜]/)
            .map(s => s.replace(/第.+[集季部]/, '').trim())
            .filter(Boolean);
        return parts.find(p => p.length >= 2 && !_SITE_WORD_RE.test(p) && !/第\d{1,8}[集期话季]/.test(p)) || parts[0] || '';
    }

    function readVideoTitle() {
        const PRECISE = {
            'qq.com': '.intro-title[title], .video-title[title], .player-title',
            'iqiyi.com': '[data-ai-entity="视频名称、主标题"], [data-ai-entity*="主标题"], .album-head-title, [class*="meta_title"]',
            'iq.com': '[data-ai-entity="视频名称、主标题"], [data-ai-entity*="主标题"]',
            'youku.com': '.video-title, a[data-pb-txid="pg_playlist_title"][title]',
            'mgtv.com': 'h2[class*="mgtv-player-aside-info__title"][title]',
            'bilibili.com': '[class*="mediaTitle"][title]',
            'sohu.com': 'a[data-pb-txid="pg_playlist_title"][title]'
        };
        const hn = location.hostname;
        for (const key of Object.keys(PRECISE)) {
            if (!hn.includes(key)) continue;
            for (const sel of PRECISE[key].split(',')) {
                const el = document.querySelector(sel.trim());
                if (!el) continue;
                const t = (el.getAttribute('title') || el.getAttribute('content') || el.textContent || '').trim();
                // 精确选择器只在影片信息面板渲染完成后存在，命中即视为可信
                if (t && wsyzyCleanTitle(t)) return {title: wsyzyCleanTitle(t), trusted: true};
            }
        }
        const og = document.querySelector('meta[property="og:title"]');
        if (og) {
            const t = (og.getAttribute('content') || og.textContent || '').trim();
            // og:title 是服务端静态输出，不随 SPA 异步加载变化，同样可信
            if (t && wsyzyCleanTitle(t)) return {title: wsyzyCleanTitle(t), trusted: true};
        }
        const h1 = document.querySelector('h1');
        if (h1) {
            const t = (h1.textContent || '').trim();
            if (t && wsyzyCleanTitle(t)) return {title: wsyzyCleanTitle(t), trusted: false};
        }
        return {title: wsyzyCleanTitle(document.title), trusted: false};
    }

    // 当前集数（v3.2.9.4 移至外层：切集自动跟随的集数漂移检测也要用）
    function curEpNum() {
        let m;
        // URL 查询参数优先：?ep=X / ?episode=X / ?p=X / ?e=X / ?cur=X（爱奇艺）
        m = location.href.match(/[?&](?:ep|episode|p|e|cur)=(\d{1,5})(?!\d)/i);
        if (m) return parseInt(m[1], 10);
        // 腾讯：/pN.html（如 /p9.html → 第9集）
        m = location.href.match(/\/p(\d{1,5})\.html/i);
        if (m) return parseInt(m[1], 10);
        // B站/Mango：/epN（如 /bangumi/play/ep33 → 第33集）
        m = location.href.match(/\/ep(\d{1,5})(?!\d)/i);
        if (m) return parseInt(m[1], 10);
        // 标题中的"第X集/期/话"或无"第"前缀的"X集"（如"第12集"、"更新至12集"）
        m = (document.title + ' ' + location.href).match(/第?\s*(\d{1,8})\s*[集期话]/);
        if (m) return parseInt(m[1], 10);
        return 0;
    }

    /* ==========================================================
     * 无损云直连模块：suggest搜索 -> API取m3u8 -> 内嵌无损云官方播放器
     * ========================================================== */
    const wsyzyDirect = (function () {
        const SITE = 'https://wsyzy.cc';
        const API = 'https://api.wsyzy.net/api.php/provide/vod/';
        const PLAYER = 'https://wsyzy.vip/m3u8/?url=';

        function req(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    timeout: 8000,
                    onload: res => {
                        if (res.status === 200 && res.responseText) resolve(res.responseText);
                        else reject(new Error('resp_err'));
                    },
                    onerror: () => reject(new Error('net_err')),
                    ontimeout: () => reject(new Error('timeout'))
                });
            });
        }

        async function searchList(title) {
            const t = await req(`${SITE}/index.php/ajax/suggest?mid=1&wd=${encodeURIComponent(title)}`);
            const j = JSON.parse(t);
            return (j.list || []).filter(x => x.id && x.name);
        }

        // 获取候选列表（官网联想偶发抖动，空结果自动重试一次）
        async function searchCandidates(title) {
            let list = [];
            try { list = await searchList(title); } catch (e) {}
            if (!list.length) {
                await new Promise(r => setTimeout(r, 600));
                if (_aborted) return [];
                try { list = await searchList(title); } catch (e) {}
            }
            return list;
        }

        // 候选排序：精确 > 前缀 > 包含 > 反向包含 > 其他（单字片名不做反向包含，避免播错片）
        function rankCandidates(list, title) {
            const score = (x) => {
                if (x.name === title) return 4;
                if (x.name.startsWith(title)) return 3;
                if (x.name.includes(title)) return 2;
                if (title.length >= 2 && title.includes(x.name)) return 1;
                return 0;
            };
            const sorted = list.slice().sort((a, b) => score(b) - score(a));
            sorted.forEach(x => { x._score = score(x); });
            return sorted;
        }

        // 首搜失败后：用剥离平台名等杂质的关键词自动重搜；返回排序后的候选列表
        async function searchWithRetry(title) {
            let list = await searchCandidates(title);
            let usedTitle = title;
            if (!list.length && !_aborted) {
                const alt = wsyzyCleanTitle(title);
                if (alt && alt !== title && alt.length >= 2) {
                    toast(`改用「${alt}」重新搜索...`, false);
                    usedTitle = alt;
                    list = await searchCandidates(alt);
                }
            }
            return rankCandidates(list, usedTitle);
        }

        // 等待页面标题就绪：SPA官网需等网络加载完成后
        // 才会把真实剧名写入 document.title，过早提取会拿到"爱奇艺xxx"这类占位标题。
        // 分级判定：
        // 1、精确选择器/og:title 命中（readVideoTitle 标记 trusted）说明页面数据已就绪
        //    → 立即返回，不等待（大部分站点走此路径）；
        // 2、h1/document.title 兜底：连续1.5秒未变化且清洗通过 → 返回；
        // 3、连续5秒未变化但仍清洗不掉 → 不再等待（标题不会因等待变干净，
        //    多为官网名与片名粘连等特殊格式），交由下游清洗+重搜兜底；
        // 4、maxWait 内仍未定论则直接采用当前标题。
        function isCleanTitle(t) {
            if (!t || t.length < 2) return false;
            const reSite = new RegExp('(?:^|[\\s\\-_：:|｜，,。·])(?:' + _SITE_NAMES + ')(?:$|[\\s\\-_：:|｜，,。·])', 'i');
            const reLead = new RegExp('^(?:' + _SITE_NAMES + ')', 'i');
            if (reSite.test(t) || reLead.test(t)) return false;
            if (/在线观看|高清正版|免费观看|完整版|正片|预告/.test(t)) return false;
            return true;
        }

        async function waitStableTitle(onTick, maxWait = 10000, interval = 500) {
            const start = Date.now();
            let cur = readVideoTitle();
            if (cur.trusted && cur.title) return cur.title; // 快路径：标题已就绪，无需等待
            let last = cur.title;
            let stableSince = Date.now();
            while (Date.now() - start < maxWait) {
                await new Promise(r => setTimeout(r, interval));
                if (_aborted) return last; // 用户已切换解析源，立即交回控制权，避免长时间占用 _running
                cur = readVideoTitle();
                const elapsed = Math.round((Date.now() - start) / 1000);
                if (cur.trusted && cur.title) {
                    onTick && onTick(elapsed, cur.title);
                    return cur.title;
                }
                if (cur.title !== last) {
                    last = cur.title;
                    stableSince = Date.now();
                } else {
                    const stableFor = Date.now() - stableSince;
                    if ((stableFor >= 1500 && isCleanTitle(last)) || (stableFor >= 5000 && last)) {
                        onTick && onTick(elapsed, last);
                        return last;
                    }
                }
                onTick && onTick(elapsed, last);
            }
            return last;
        }

        function parseEps(pu) {
            if (!pu) return [];
            return pu.split('$$$')[0].split('#')
                .map(s => {
                    const i = s.indexOf('$');
                    return i > 0 ? { name: s.slice(0, i), url: s.slice(i + 1) } : { name: '', url: s };
                })
                .filter(e => /^https?:\/\//.test(e.url));
        }

        async function getEpisodes(id) {
            const t = await req(`${API}?ac=detail&ids=${id}`);
            const j = JSON.parse(t);
            const v = j.list && j.list[0];
            return parseEps(v && v.vod_play_url);
        }

        // 广告声抑制器（直连模式期间启用，作为 reomveVideo 的第二道防线）：
        // 静音页面残留媒体元素（不 pause、不删 src，避免触发官网播放器的异常处理）。
        // 覆盖主文档 + 同源 iframe；离开直连模式(切换其他解析源)时自动停止并还原行为。
        let _stopSuppressor = null;
        function startAdSoundSuppressor() {
            if (_stopSuppressor) return;
            const inOurs = (el) => el.closest && el.closest('.' + _CONFIG_.iframeWrapperClass);
            const silence = (m) => { try { if (!m.muted) m.muted = true; if (m.volume !== 0) m.volume = 0; } catch (e) {} };
            const handler = (ev) => {
                const m = ev.target;
                if (!m || !m.tagName || !/^(video|audio)$/i.test(m.tagName)) return;
                if (inOurs(m)) return;
                silence(m);
            };
            document.addEventListener('play', handler, true);
            document.addEventListener('playing', handler, true);
            document.addEventListener('volumechange', handler, true);
            const timer = setInterval(() => {
                // 直连播放器已不在页面中（用户切走了）→ 自行退出
                const wrap = document.querySelector('.' + _CONFIG_.iframeWrapperClass);
                if (!wrap || !document.contains(wrap)) { stopAdSoundSuppressor(); return; }
                const scan = (doc) => doc.querySelectorAll('video,audio').forEach((m) => { if (!inOurs(m)) silence(m); });
                scan(document);
                document.querySelectorAll('iframe').forEach((f) => {
                    if (inOurs(f)) return;
                    let doc = null;
                    try { doc = f.contentDocument; } catch (e) { return; }
                    if (doc) { try { scan(doc); } catch (e) {} }
                });
            }, 400);
            _stopSuppressor = () => {
                clearInterval(timer);
                document.removeEventListener('play', handler, true);
                document.removeEventListener('playing', handler, true);
                document.removeEventListener('volumechange', handler, true);
                _stopSuppressor = null;
            };
        }
        function stopAdSoundSuppressor() { if (_stopSuppressor) _stopSuppressor(); }

        function takeover() {
            return new Promise((resolve, reject) => {
                util.findTargetEle(_CONFIG_.currentPlayerNode.container).then((container) => {
                    if (_aborted) { reject(new Error('已取消')); return; }
                    const cleanupSelectors = [...new Set(((_CONFIG_.currentPlayerNode.displayNodes || []).concat(_CONFIG_.currentPlayerNode.cleanupNodes || [])).filter(Boolean))];
                    const cleanup = () => {
                        cleanupSelectors.forEach((selector) => {
                            document.querySelectorAll(selector).forEach((node) => {
                                node.style.setProperty("display", "none", "important");
                                node.style.setProperty("opacity", "0", "important");
                                node.style.setProperty("pointer-events", "none", "important");
                            });
                        });
                    };
                    cleanup();
                    if (_CONFIG_.cleanupTimer) clearInterval(_CONFIG_.cleanupTimer);
                    _CONFIG_.cleanupTimer = setInterval(cleanup, 500);
                    if (!_CONFIG_.wsyzyFsbBound) {
                        document.addEventListener("fullscreenchange", cleanup);
                        _CONFIG_.wsyzyFsbBound = true;
                    }

                    const frameLayout = buildPlayerFrameLayout({
                        isMobile: !!_CONFIG_.isMobile,
                        containerRect: container.getBoundingClientRect(),
                        containerStyle: { paddingTop: window.getComputedStyle(container).paddingTop },
                        viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0
                    });
                    $(container).empty();
                    util.reomveVideo();
                    if (window.getComputedStyle(container).position === "static") container.style.position = "relative";
                    applyInlineStyles(container, frameLayout.containerStyles);

                    const wrapper = document.createElement("div");
                    wrapper.className = _CONFIG_.iframeWrapperClass;
                    applyInlineStyles(wrapper, frameLayout.wrapperStyles);

                    const epBar = document.createElement("div");
                    applyInlineStyles(epBar, {
                        position: "absolute", top: "0", right: "0", bottom: "0", width: "170px",
                        overflowX: "hidden", overflowY: "auto",
                        zIndex: "2147483647", display: "none",
                        background: "rgba(11,17,29,.92)", padding: "8px 6px", boxSizing: "border-box",
                        borderRadius: "10px 0 0 10px", border: "1px solid rgba(148,163,184,.2)",
                        borderRight: "none", boxShadow: "-6px 0 16px rgba(0,0,0,.45)"
                    });

                    const iframe = document.createElement("iframe");
                    iframe.frameBorder = "0";
                    iframe.allow = "autoplay; encrypted-media; fullscreen";
                    iframe.allowFullscreen = true;
                    iframe.referrerPolicy = "no-referrer";
                    applyInlineStyles(iframe, frameLayout.iframeStyles);

                    // 占位层：接管瞬间盖住容器（掐断官方播放器广告声），搜索完成后再隐藏
                    const placeholder = document.createElement("div");
                    applyInlineStyles(placeholder, {
                        position: "absolute", inset: "0", zIndex: "2147483646",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#000", color: "#c4b5fd", fontSize: "15px",
                        textAlign: "center", padding: "0 16px", lineHeight: "1.8",
                        flexDirection: "column", gap: "6px"
                    });
                    placeholder.textContent = "无损云加载中...";

                    const askChoice = (candidates, detailMap) => new Promise((resolveChoice, rejectChoice) => {
                        let settled = false;
                        let watch = null;
                        const finish = (fn, val) => {
                            if (settled) return;
                            settled = true;
                            if (watch) clearInterval(watch);
                            // 恢复 placeholder 原始定位并移回 wrapper
                            placeholder.style.position = 'absolute';
                            placeholder.style.inset = '0';
                            placeholder.style.left = '';
                            placeholder.style.top = '';
                            placeholder.style.width = '';
                            placeholder.style.height = '';
                            if (placeholder.parentNode && placeholder.parentNode !== wrapper) {
                                wrapper.appendChild(placeholder);
                            }
                            fn(val);
                        };
                        placeholder.innerHTML = '';
                        const head = document.createElement('div');
                        head.textContent = '搜到多个相关结果，请选择要播放的：';
                        applyInlineStyles(head, {
                            fontSize: _CONFIG_.isMobile ? '13px' : '14px',
                            fontWeight: '600', color: '#c4b5fd',
                            padding: '0 10px', lineHeight: '1.6', flexShrink: '0'
                        });
                        const box = document.createElement('div');
                        box.classList.add('wsyzy-no-scrollbar');
                        applyInlineStyles(box, {
                            width: 'min(440px, 94%)', maxHeight: '74%',
                            overflowY: 'auto', scrollbarWidth: 'none',
                            display: 'flex', flexDirection: 'column',
                            gap: '8px', padding: '2px 4px', boxSizing: 'border-box'
                        });
                        if (!document.getElementById('wsyzy-no-scroll-style')) {
                            const s = document.createElement('style');
                            s.id = 'wsyzy-no-scroll-style';
                            s.textContent = '.wsyzy-no-scrollbar::-webkit-scrollbar{display:none}';
                            document.head.appendChild(s);
                        }
                        // 面板排序：年份优先（最新在前），同年份内名称匹配度优先
                        const sorted = candidates.slice().sort((a, b) => {
                            const ya = detailMap && detailMap[a.id] ? parseInt(detailMap[a.id].vod_year) || 0 : 0;
                            const yb = detailMap && detailMap[b.id] ? parseInt(detailMap[b.id].vod_year) || 0 : 0;
                            if (ya !== yb) return yb - ya;
                            const sa = a._score || 0, sb = b._score || 0;
                            return sb - sa;
                        });
                        sorted.forEach((c, i) => {
                            const d = detailMap && detailMap[c.id];
                            // 详情信息行：类别 · 年份 · 集数状态 · 更新时间（缺失的字段自动跳过）
                            const meta = [];
                            if (d) {
                                if (d.type_name) meta.push(d.type_name);
                                if (d.vod_year) meta.push(d.vod_year);
                                if (d.vod_remarks) meta.push(d.vod_remarks);
                                if (d.vod_time) meta.push('更新 ' + String(d.vod_time).split(' ')[0]);
                            }

                            const btn = document.createElement('button');
                            btn.type = 'button';
                            applyInlineStyles(btn, {
                                display: 'block', width: '100%', margin: '0',
                                padding: _CONFIG_.isMobile ? '9px 24px' : '8px 24px',
                                borderRadius: '999px', cursor: 'pointer', textAlign: 'center',
                                border: '1px solid ' + (i === 0 ? 'rgba(196,181,253,.8)' : 'rgba(255,255,255,.16)'),
                                background: i === 0 ? 'rgba(139,92,246,.20)' : 'rgba(255,255,255,.07)',
                                boxShadow: i === 0 ? '0 2px 12px rgba(139,92,246,.32)' : 'none',
                                transition: 'all .15s ease', flexShrink: '0'
                            });
                            const nameEl = document.createElement('div');
                            nameEl.textContent = c.name; // 外部数据只走 textContent，防注入
                            applyInlineStyles(nameEl, {
                                fontSize: _CONFIG_.isMobile ? '14px' : '13px', fontWeight: '700',
                                lineHeight: '1.5', color: '#f8fafc',
                                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                            });
                            const metaEl = document.createElement('div');
                            metaEl.textContent = (i === 0 ? '⭐推荐 · ' : '') + (meta.join(' · ') || '暂无详情');
                            applyInlineStyles(metaEl, {
                                fontSize: _CONFIG_.isMobile ? '11px' : '10px', lineHeight: '1.5', marginTop: '2px',
                                color: i === 0 ? 'rgba(221,214,254,.92)' : 'rgba(203,213,225,.7)'
                            });
                            btn.appendChild(nameEl);
                            btn.appendChild(metaEl);
                            btn.addEventListener('mouseenter', () => {
                                if (i === 0) {
                                    btn.style.background = 'rgba(139,92,246,.32)';
                                } else {
                                    btn.style.background = 'rgba(139,92,246,.16)';
                                    btn.style.borderColor = 'rgba(139,92,246,.5)';
                                }
                            });
                            btn.addEventListener('mouseleave', () => {
                                if (i === 0) {
                                    btn.style.background = 'rgba(139,92,246,.20)';
                                } else {
                                    btn.style.background = 'rgba(255,255,255,.07)';
                                    btn.style.borderColor = 'rgba(255,255,255,.16)';
                                }
                            });
                            btn.addEventListener('click', (ev) => {
                                ev.stopPropagation();
                                finish(resolveChoice, c);
                            });
                            box.appendChild(btn);
                        });
                        placeholder.appendChild(head);
                        placeholder.appendChild(box);
                        // 移到 body 上，防止页面 JS 重渲染容器时把 placeholder 一起清掉
                        if (placeholder.parentNode !== document.body) document.body.appendChild(placeholder);
                        // 按 iframe 实际位置定位；iframe 已被页面清掉时回退到视口尺寸
                        const ir = iframe.getBoundingClientRect();
                        const pw = ir.width > 0 ? ir.width : window.innerWidth;
                        const ph = ir.height > 0 ? ir.height : window.innerHeight;
                        const pl = ir.width > 0 ? ir.left : 0;
                        const pt = ir.height > 0 ? ir.top : 0;
                        placeholder.style.position = 'fixed';
                        placeholder.style.inset = 'auto';
                        placeholder.style.left = pl + 'px';
                        placeholder.style.top = pt + 'px';
                        placeholder.style.width = pw + 'px';
                        placeholder.style.height = ph + 'px';
                        placeholder.style.display = 'flex';
                        // 等待选择期间用户切走了（_aborted）→ 结束等待，由主流程静默退出
                        watch = setInterval(() => {
                            if (_aborted) finish(rejectChoice, new Error('已取消'));
                        }, 300);
                    });

                    wrapper.appendChild(iframe);
                    wrapper.appendChild(epBar);
                    wrapper.appendChild(placeholder);
                    container.appendChild(wrapper);

                    resolve({
                        iframe, epBar, wrapper, container,
                        setStatus: (t) => { placeholder.textContent = t; placeholder.style.display = "flex"; },
                        hidePlaceholder: () => { placeholder.style.display = "none"; },
                        askChoice
                    });
                }).catch(reject);
            });
        }

        function mountEpBar(epBar, wrapper, load, eps, curIdx) {
            epBar.innerHTML = '';
            let current = curIdx;
            eps.forEach((ep, idx) => {
                const btn = document.createElement('span');
                btn.textContent = ep.name || ('第' + (idx + 1) + '集');
                applyInlineStyles(btn, {
                    display: 'block', margin: '4px 0', padding: '5px 10px',
                    fontSize: '12px', lineHeight: '20px', borderRadius: '6px', cursor: 'pointer',
                    userSelect: 'none', transition: 'all .15s ease', textAlign: 'center',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    color: idx === current ? '#ffffff' : '#cbd5e1',
                    background: idx === current ? '#7c3aed' : 'rgba(148,163,184,.08)',
                    border: '1px solid ' + (idx === current ? '#a78bfa' : 'rgba(148,163,184,.2)'),
                    boxShadow: idx === current ? '0 2px 6px rgba(109,40,217,.4)' : 'none'
                });
                btn.addEventListener('mouseenter', () => {
                    if (idx !== current) { btn.style.background = 'rgba(139,92,246,.22)'; btn.style.borderColor = '#a78bfa'; }
                });
                btn.addEventListener('mouseleave', () => {
                    if (idx !== current) { btn.style.background = 'rgba(148,163,184,.08)'; btn.style.borderColor = 'rgba(148,163,184,.2)'; }
                });
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    load(ep);
                    [...epBar.children].forEach(c => {
                        c.style.background = 'rgba(148,163,184,.08)'; c.style.color = '#cbd5e1';
                        c.style.borderColor = 'rgba(148,163,184,.2)'; c.style.boxShadow = 'none';
                    });
                    btn.style.background = '#7c3aed'; btn.style.color = '#ffffff';
                    btn.style.borderColor = '#a78bfa'; btn.style.boxShadow = '0 2px 6px rgba(109,40,217,.4)';
                    current = idx;
                });
                epBar.appendChild(btn);
            });
            const trigger = document.createElement('div');
            applyInlineStyles(trigger, {
                position: 'absolute', top: '0', right: '0', bottom: '0',
                width: '10px', zIndex: '2147483645', background: 'transparent'
            });
            wrapper.appendChild(trigger);
            trigger.addEventListener('mouseenter', () => { epBar.style.display = 'block'; });
            trigger.addEventListener('mouseleave', (ev) => {
                if (epBar.contains(ev.relatedTarget)) return;
                epBar.style.display = 'none';
            });
            epBar.addEventListener('mouseleave', (ev) => {
                if (trigger.contains(ev.relatedTarget)) return;
                epBar.style.display = 'none';
            });
            if (_CONFIG_.isMobile) {
                const tab = document.createElement('div');
                tab.textContent = '☰ 选集';
                applyInlineStyles(tab, {
                    position: 'absolute', top: '10px', right: '10px', zIndex: '2147483647',
                    padding: '6px 12px', fontSize: '13px', lineHeight: '18px',
                    background: 'rgba(11,17,29,.88)', color: '#c4b5fd',
                    border: '1px solid rgba(139,92,246,.55)', borderRadius: '8px', cursor: 'pointer',
                    userSelect: 'none', boxShadow: '0 3px 10px rgba(0,0,0,.35)',
                    transition: 'all .15s ease'
                });
                tab.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    epBar.style.display = epBar.style.display === 'block' ? 'none' : 'block';
                });
                wrapper.appendChild(tab);
            }
        }

        function toast(msg, autoHide) {
            let el = document.getElementById('wsyzy_toast');
            if (!el) {
                el = document.createElement('div');
                el.id = 'wsyzy_toast';
                applyInlineStyles(el, {
                    position: 'fixed', top: '8%', transform: 'translate(-50%, -50%)',
                    zIndex: '2147483647', background: 'rgba(15,23,42,.94)', color: '#e2e8f0',
                    border: '1px solid rgba(139,92,246,.5)', borderRadius: '10px', padding: '12px 24px',
                    fontSize: '14px', textAlign: 'center', maxWidth: '80vw',
                    boxShadow: '0 8px 28px rgba(0,0,0,.5)', lineHeight: '1.6'
                });
                document.body.appendChild(el);
            }
            el.textContent = msg;
            el.style.display = 'block';
            const viewportW = window.innerWidth || document.documentElement.clientWidth;
            let centerX = viewportW / 2;
            const wrap = document.querySelector('.' + _CONFIG_.iframeWrapperClass);
            if (wrap) {
                const r = wrap.getBoundingClientRect();
                if (r.width > 0) centerX = r.left + r.width / 2;
            }
            const half = el.offsetWidth / 2;
            centerX = Math.max(half + 8, Math.min(centerX, viewportW - half - 8));
            el.style.left = centerX + 'px';
            clearTimeout(el._timer);
            if (autoHide !== false) el._timer = setTimeout(() => { el.style.display = 'none'; }, 2500);
        }

        let _running = false;
        let _aborted = false;
        let _takeoverTimeout = false;
        let _retryTimer = null;
        let _restarting = false;

        function abort() {
            _aborted = true;
            if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null; }
            stopAdSoundSuppressor();
            if (_CONFIG_.cleanupTimer) { clearInterval(_CONFIG_.cleanupTimer); _CONFIG_.cleanupTimer = null; }
        }

        async function play(isAutoRetry) {
            if (_running) {
                toast('正在加载中，请稍候...');
                return;
            }
            _running = true;
            _aborted = false;
            _takeoverTimeout = false;
            console.log('[无损云直连] 开始解析' + (isAutoRetry ? '（自动重试）' : ''), window.location.href);
            let ui = null;
            try {
                // 第一步：启动广告声抑制（只静音，不 pause/不删 src，不干扰页面 JS）
                startAdSoundSuppressor();
                const takeoverP = takeover();
                takeoverP.catch(() => {}); // 竞速失败后延迟到达的 reject 不视为未处理异常
                let raceTimer = null;
                try {
                    ui = await Promise.race([
                        takeoverP,
                        new Promise((_, rej) => {
                            // 竞速结束后必须清除未触发的定时器，否则其延迟置位 _aborted 会误杀已正常播放的流程
                            raceTimer = setTimeout(() => { _takeoverTimeout = true; _aborted = true; rej(new Error('未找到官方播放器位置')); }, 10000);
                        })
                    ]);
                } finally {
                    clearTimeout(raceTimer);
                }
                if (_aborted) throw new Error('已取消');

                // 第二步：等待官方页面把真实剧名写入标题（SPA站点需数秒~数十秒）
                const title = await waitStableTitle((sec, cur) => {
                    ui.setStatus(cur ? `「${cur}」等待片名稳定 ${sec}s...` : `等待片名稳定 ${sec}s...`);
                });
                if (_aborted) throw new Error('已取消');
                if (!title || title.length < 2) throw new Error('无法识别片名');
                ui.setStatus(`「${title}」无损云搜索中...`);
                toast(`「${title}」无损云搜索中...`, false);

                const candidates = await searchWithRetry(title);
                if (_aborted) throw new Error('已取消');
                if (!candidates.length) throw new Error(`无损云未收录「${title}」，请切换其他解析源`);

                let hit;
                if (candidates.length === 1) {
                    hit = candidates[0];
                } else {
                    // 详情一次拉全：集数判定与选择面板共用；失败不阻塞，降级为仅名称选择
                    ui.setStatus(`搜到 ${candidates.length} 个结果，正在加载详情...`);
                    const detailMap = {};
                    try {
                        const dt = await req(`${API}?ac=detail&ids=${candidates.map(c => c.id).join(',')}`);
                        const dj = JSON.parse(dt);
                        (dj.list || []).forEach(d => { detailMap[d.vod_id] = d; });
                    } catch (e) {}
                    if (_aborted) throw new Error('已取消');

                    const epNum = curEpNum();
                    if (epNum > 0) {
                        // 硬判定：当前集数只有唯一一个候选的集数足够 → 必然是它
                        const viable = candidates.filter(c => {
                            const d = detailMap[c.id];
                            return d && parseEps(d.vod_play_url).length >= epNum;
                        });
                        if (viable.length === 1) hit = viable[0];
                    }
                    if (!hit && candidates[0]._score === 4 && (candidates.length < 2 || candidates[1]._score < 3)) {
                        // 名称信号：首候选与搜索标题精确一致，且无前缀竞争者
                        hit = candidates[0];
                    }
                    if (!hit) {
                        toast(`搜到 ${candidates.length} 个结果，请选择要播放的`, false);
                        hit = await ui.askChoice(candidates, detailMap); // 等待期间用户切源 → 抛出「已取消」
                        if (_aborted) throw new Error('已取消');
                    }
                }
                // 页面 JS 可能在 askChoice 期间清掉容器内容，导致 wrapper 脱离 DOM
                if (!document.contains(ui.wrapper) && ui.container && document.contains(ui.container)) {
                    ui.container.appendChild(ui.wrapper);
                }
                ui.setStatus(`命中「${hit.name}」，获取选集...`);
                toast(`命中「${hit.name}」，获取选集...`, false);

                const eps = await getEpisodes(hit.id);
                if (_aborted) throw new Error('已取消');
                if (!eps.length) throw new Error('未取到播放地址，请切换其他解析源');

                let idx = 0;
                const num = curEpNum();
                if (num > 0) {
                    const f = eps.findIndex(e => {
                        const m = e.name.match(/\d{1,8}/);
                        return m && parseInt(m[0], 10) === num;
                    });
                    if (f >= 0) idx = f;
                }
                toast(`共${eps.length}集，正在加载播放器...`, false);

                const load = (ep) => { if (!_aborted) ui.iframe.src = PLAYER + encodeURIComponent(ep.url); };
                load(eps[idx]);
                ui.hidePlaceholder();
                mountEpBar(ui.epBar, ui.wrapper, load, eps, idx);
                console.log(`[无损云直连] 解析成功: 「${title}」→「${hit.name}」共${eps.length}集，当前第${idx + 1}集`);
                parseStats.record(parseStats.directName(), true);
                toast(_CONFIG_.isMobile
                    ? '✓ 无损云播放中（点右上角「☰ 选集」可换集）'
                    : '✓ 无损云播放中（鼠标移到播放器右侧可换集）');
            } catch (e) {
                if (_aborted && !_takeoverTimeout) {
                    console.log('[无损云直连] 流程已取消');
                } else {
                    console.warn('[无损云直连] 解析失败' + (isAutoRetry ? '（重试）' : '') + ':', e.message);
                    // 非重试失败还会自动再试一次，最终成败由重试那次记录；重试仍失败才计失败
                    if (isAutoRetry) parseStats.record(parseStats.directName(), false);
                    toast('✗ ' + e.message);
                    if (ui) ui.setStatus('✗ ' + e.message);
                    // 失败时清理 cleanupTimer，停止持续隐藏官方播放器元素
                    // （若已被外部 abort 清理/接管则跳过，避免误清其他流程的定时器）
                    if (!_aborted && _CONFIG_.cleanupTimer) { clearInterval(_CONFIG_.cleanupTimer); _CONFIG_.cleanupTimer = null; }
                    // 失败自动重试一次（v3.2.9.4）：搜索抖动/容器未就绪等瞬时失败
                    // 不再停在错误占位层；重试仍失败才交还用户手动处理
                    if (!isAutoRetry) {
                        toast('将在 5 秒后自动重试...', false);
                        if (ui) ui.setStatus('将在 5 秒后自动重试...');
                        _retryTimer = setTimeout(() => {
                            _retryTimer = null;
                            // 等待期间被用户切走（abort）→ 放弃重试
                            if (!_aborted || _takeoverTimeout) play(true);
                        }, 5000);
                    }
                }
                stopAdSoundSuppressor();
            } finally {
                _running = false;
            }
        }

        // 重新解析（v3.2.9.4）：切集自动跟随/重挂守卫触发时使用。
        // 先 abort 掉进行中的旧流程并等其收尾，避免新旧流程共用 _aborted 互相干扰
        async function restart() {
            if (_restarting) return;
            _restarting = true;
            try {
                abort();
                const t0 = Date.now();
                while (_running && Date.now() - t0 < 12000) {
                    await new Promise(r => setTimeout(r, 150));
                }
                if (!_running) play(true);
            } finally {
                _restarting = false;
            }
        }

        return { play, stop: abort, restart, busy: () => _running };
    })();

    /* ==========================================================
     * 接口测速优选模块：并发探测各解析接口的响应耗时，
     * 供面板「优选 ⚡」按钮按速度排序并标记最快线路
     * ========================================================== */
    const speedTest = (function () {
        const TIMEOUT = 5000;

        // 解析接口只探测源站首页（避免触发真实解析任务给免费接口加压），
        // 无损云用官网轻量搜索接口作为健康探测
        function probeUrl(item) {
            if (item.wsyzy) return 'https://wsyzy.cc/index.php/ajax/suggest?mid=1&wd=a';
            try {
                return new URL(item.url).origin + '/';
            } catch (e) {
                return null;
            }
        }

        // 耗时以 onload/onerror/ontimeout 中先到达者为准；失败统一返回 -1（超时）
        function probe(item) {
            const url = probeUrl(item);
            return new Promise((resolve) => {
                if (!url) {
                    resolve(-1);
                    return;
                }
                const start = Date.now();
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    timeout: TIMEOUT,
                    headers: {'Cache-Control': 'no-cache'},
                    onload: () => resolve(Math.max(1, Date.now() - start)),
                    onerror: () => resolve(-1),
                    ontimeout: () => resolve(-1)
                });
            });
        }

        return { probe };
    })();

    /* ==========================================================
     * 失败率降级模块（v3.2.9.5）：按源名统计解析成败并持久化（GM 存储，全站共享）。
     * 失败率过高的源：自动解析时避开、面板标记「低成功率」、测速排序沉底。
     * 成败信号：无损云有明确结果；内嵌接口跨源读不到内部状态，以
     * 「判定窗口内被用户切走=失败；未切走则按 iframe 是否加载完成」近似判定。
     * ========================================================== */
    const parseStats = (function () {
        const KEY = 'vv_parse_stats';
        const MIN_SAMPLES = 3;   // 样本不足不判定，避免早期误杀
        const FAIL_RATE = 0.6;   // 失败率阈值
        let data = {};
        try { data = JSON.parse(GM_getValue(KEY, '{}')) || {}; } catch (e) { data = {}; }

        function save() { GM_setValue(KEY, JSON.stringify(data)); }

        function record(name, ok) {
            if (!name) return;
            const s = data[name] || (data[name] = { ok: 0, fail: 0 });
            if (ok) s.ok++; else s.fail++;
            save();
            console.log(`[失败率统计] ${name} ${ok ? '成功' : '失败'} → 累计 ${s.ok}✓/${s.fail}✗`);
            refreshMarks();
        }

        function rate(name) {
            const s = data[name];
            if (!s) return null;
            const total = s.ok + s.fail;
            return total < MIN_SAMPLES ? null : s.fail / total;
        }

        function degraded(name) {
            const r = rate(name);
            return r !== null && r >= FAIL_RATE;
        }

        // 面板列表同步「降级」标记
        function refreshMarks() {
            const box = document.getElementById(_CONFIG_.vipBoxId);
            if (!box) return;
            box.querySelectorAll('.vip_list li').forEach((li) => {
                const item = _CONFIG_.videoParseList[parseInt(li.getAttribute('data-index'), 10)];
                li.classList.toggle('vip_demoted', !!(item && degraded(item.name)));
            });
        }

        function directName() {
            const o = _CONFIG_.videoParseList.find(v => v.wsyzy);
            return o ? o.name : '';
        }

        return { record, degraded, refreshMarks, directName, MIN_SAMPLES, FAIL_RATE };
    })();

    class BaseConsumer {
        constructor() {
            // 嵌入代数号：废弃迟到的 findTargetEle 结果，防止旧请求覆盖用户后来的选择
            this._embedGen = 0;
            // 失败率降级：当前源的在候判定（窗口期内被切走=失败，超时按 iframe 加载结果）
            this._pending = null;
            this.parse = () => {
                util.findTargetEle('body')
                    .then((container) => this.preHandle(container))
                    .then((container) => this.generateElement(container))
                    .then((container) => this.bindEvent(container))
                    .then((container) => this.autoPlay(container))
                    .then((container) => this.postHandle(container));
            }
        }

        preHandle(container) {
            [...new Set(((_CONFIG_.currentPlayerNode.displayNodes || []).concat(_CONFIG_.currentPlayerNode.cleanupNodes || [])).filter(Boolean))].forEach((selector) => {
                document.querySelectorAll(selector).forEach((obj) => {
                    obj.style.setProperty("display", "none", "important");
                    obj.style.setProperty("opacity", "0", "important");
                    obj.style.setProperty("pointer-events", "none", "important");
                });
            });
            return new Promise((resolve, reject) => resolve(container));
        }

        generateElement(container) {
            GM_addStyle(`
                /* ===== v3.2.9.2 视觉重设计：深色玻璃 + 紫色主色 ===== */
                #${_CONFIG_.vipBoxId} {
                    cursor: pointer; position: fixed; top: 120px; left: 0px; z-index: 2147483647; text-align: left;
                    display: flex !important; flex-direction: column; align-items: flex-start; gap: 7px;
                    visibility: visible !important; opacity: 1 !important; pointer-events: auto !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Microsoft YaHei", "Segoe UI", sans-serif;
                }
                /* 悬浮按钮基座（玻璃拟态） */
                #${_CONFIG_.vipBoxId} .img_box {
                    display: flex; align-items: center; justify-content: center; box-sizing: border-box;
                    width: 36px; height: 36px; color: #cbd5e1; font-size: 13px; font-weight: 700; line-height: 1;
                    background: rgba(15, 23, 42, .78); border: 1px solid rgba(148, 163, 184, .22); border-radius: 11px !important;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, .35), inset 0 1px 0 rgba(255, 255, 255, .06);
                    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
                    margin: 0; user-select: none; cursor: pointer;
                    transition: background .18s, border-color .18s, box-shadow .18s, transform .18s, filter .18s;
                    transition-timing-function: cubic-bezier(.2, .8, .2, 1);
                }
                #${_CONFIG_.vipBoxId} .img_box:hover { background: rgba(30, 41, 59, .88); border-color: rgba(148, 163, 184, .45); }
                #${_CONFIG_.vipBoxId} .img_box:active { transform: scale(.93); }
                /* 主按钮：VIP 品牌（紫色渐变 + 辉光） */
                #${_CONFIG_.vipBoxId} .vip_icon { position: relative; }
                #${_CONFIG_.vipBoxId} .vip_icon > .img_box {
                    width: 38px; height: 38px; font-size: 12px; font-weight: 800; letter-spacing: .06em; color: #fff;
                    background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 55%, #a78bfa 100%);
                    border-color: rgba(196, 181, 253, .55);
                    box-shadow: 0 6px 20px rgba(109, 40, 217, .45), inset 0 1px 0 rgba(255, 255, 255, .25);
                }
                #${_CONFIG_.vipBoxId} .vip_icon > .img_box:hover {
                    filter: brightness(1.12);
                    box-shadow: 0 8px 26px rgba(109, 40, 217, .55), inset 0 1px 0 rgba(255, 255, 255, .25);
                }
                /* 自动解析开关：状态化配色 */
                #${_CONFIG_.vipBoxId} #vip_auto { font-size: 12px; color: #94a3b8; }
                #${_CONFIG_.vipBoxId} #vip_auto.on {
                    color: #c4b5fd; border-color: rgba(139, 92, 246, .5); background: rgba(76, 29, 149, .6);
                    box-shadow: 0 4px 14px rgba(109, 40, 217, .35), inset 0 1px 0 rgba(255, 255, 255, .12);
                }
                /* 刷新按钮：图标 + 按压旋转反馈 */
                #${_CONFIG_.vipBoxId} #vip_reload { color: #94a3b8; }
                #${_CONFIG_.vipBoxId} #vip_reload:hover { color: #e2e8f0; }
                #${_CONFIG_.vipBoxId} #vip_reload svg { display: block; transition: transform .45s cubic-bezier(.2, .8, .2, 1); }
                #${_CONFIG_.vipBoxId} #vip_reload:active svg { transform: rotate(360deg); }
                /* ===== 解析面板（玻璃卡片） ===== */
                #${_CONFIG_.vipBoxId} .vip_list {
                    display: none; position: absolute; left: calc(100% + 10px); top: -6px;
                    width: 400px; max-width: calc(100vw - 60px); max-height: min(500px, 82vh);
                    overflow-y: auto; overflow-x: hidden; box-sizing: border-box; text-align: left;
                    background: rgba(11, 17, 29, .92);
                    -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
                    border: 1px solid rgba(148, 163, 184, .16); border-radius: 16px;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, .5), inset 0 1px 0 rgba(255, 255, 255, .05);
                    scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, .3) transparent;
                    animation: vipPanelIn .18s cubic-bezier(.2, .8, .2, 1);
                }
                @keyframes vipPanelIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
                #${_CONFIG_.vipBoxId} .vip_list::-webkit-scrollbar { width: 6px; }
                #${_CONFIG_.vipBoxId} .vip_list::-webkit-scrollbar-track { background: transparent; }
                #${_CONFIG_.vipBoxId} .vip_list::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, .25); border-radius: 3px; }
                #${_CONFIG_.vipBoxId} .vip_list::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, .4); }
                /* 面板头（滚动吸顶） */
                #${_CONFIG_.vipBoxId} .vip_panel_head {
                    display: flex; align-items: center; gap: 8px; padding: 12px 14px 11px;
                    border-bottom: 1px solid rgba(148, 163, 184, .12);
                    position: sticky; top: 0; z-index: 1; background: rgba(11, 17, 29, .97);
                }
                #${_CONFIG_.vipBoxId} .vip_panel_title { flex: 1; min-width: 0; font-size: 13px; font-weight: 700; color: #f1f5f9; letter-spacing: .02em; }
                #${_CONFIG_.vipBoxId} .vip_panel_title em { font-style: normal; font-size: 10px; font-weight: 500; color: #64748b; margin-left: 6px; letter-spacing: 0; }
                /* 幽灵胶囊按钮（面板头部 + 分节共用） */
                #${_CONFIG_.vipBoxId} .vip_list button {
                    display: inline-flex; align-items: center; height: 24px; padding: 0 10px;
                    border-radius: 8px; border: 1px solid rgba(148, 163, 184, .22);
                    background: rgba(148, 163, 184, .08); color: #94a3b8;
                    font-size: 11px; font-weight: 600; line-height: 1; cursor: pointer; user-select: none; white-space: nowrap;
                    position: static; transform: none; box-shadow: none;
                    transition: color .16s, border-color .16s, background .16s;
                }
                #${_CONFIG_.vipBoxId} .vip_list button:hover { color: #e2e8f0; border-color: rgba(148, 163, 184, .45); background: rgba(148, 163, 184, .14); }
                #${_CONFIG_.vipBoxId} .vip_sponsor_btn:hover { color: #f9a8d4; border-color: rgba(244, 114, 182, .5); background: rgba(236, 72, 153, .14); }
                #${_CONFIG_.vipBoxId} .vip_repo_btn:hover { color: #93c5fd; border-color: rgba(96, 165, 250, .5); background: rgba(59, 130, 246, .14); }
                #${_CONFIG_.vipBoxId} .vip_more_btn:hover { color: #c4b5fd; border-color: rgba(139, 92, 246, .5); background: rgba(139, 92, 246, .12); }
                #${_CONFIG_.vipBoxId} .vip_web_btn:hover { color: #86efac; border-color: rgba(74, 222, 128, .5); background: rgba(34, 197, 94, .12); }
                #${_CONFIG_.vipBoxId} .vip_speed_btn:hover { color: #fde047; border-color: rgba(250, 204, 21, .5); background: rgba(250, 204, 21, .12); }
                #${_CONFIG_.vipBoxId} .vip_list button:focus-visible { outline: 2px solid #a78bfa; outline-offset: 2px; }
                /* 分节 */
                #${_CONFIG_.vipBoxId} .vip_section { padding: 10px 12px 6px; }
                #${_CONFIG_.vipBoxId} .vip_sec_head { display: flex; align-items: center; gap: 8px; padding: 0 2px 8px; position: static; }
                #${_CONFIG_.vipBoxId} .vip_sec_head h3 {
                    flex: 1; min-width: 0; margin: 0; padding: 0 !important;
                    display: flex; align-items: center; overflow: hidden; white-space: nowrap;
                    font-size: 12px !important; font-weight: 700; color: #e2e8f0 !important; letter-spacing: .03em;
                }
                #${_CONFIG_.vipBoxId} .vip_sec_head h3 em { font-style: normal; font-size: 10px; font-weight: 500; color: #64748b; margin-left: 6px; letter-spacing: 0; }
                /* 接口网格：两列胶囊 */
                #${_CONFIG_.vipBoxId} .vip_list ul {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0; padding: 0; list-style: none;
                }
                #${_CONFIG_.vipBoxId} .vip_list li {
                    display: flex; align-items: center; justify-content: center; gap: 4px;
                    box-sizing: border-box; height: 30px; line-height: 28px; padding: 0 8px;
                    border-radius: 9px; font-size: 12.5px; font-weight: 500; color: #cbd5e1; text-align: center;
                    background: rgba(148, 163, 184, .06); border: 1px solid rgba(148, 163, 184, .14);
                    overflow: hidden; white-space: nowrap; cursor: pointer; float: none;
                    transition: color .15s, border-color .15s, background .15s, box-shadow .15s, transform .15s;
                }
                #${_CONFIG_.vipBoxId} .vip_list li .vip_name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
                /* 测速耗时徽标（优选功能） */
                #${_CONFIG_.vipBoxId} .vip_list li .vip_ping {
                    flex-shrink: 0; font-style: normal; font-size: 9.5px; line-height: 1; font-weight: 600;
                    padding: 3px 4px; border-radius: 4px; color: #64748b; background: rgba(148, 163, 184, .14);
                }
                #${_CONFIG_.vipBoxId} .vip_list li .vip_ping:empty { display: none; }
                #${_CONFIG_.vipBoxId} .vip_list li .vip_ping.fast { color: #4ade80; background: rgba(74, 222, 128, .14); }
                #${_CONFIG_.vipBoxId} .vip_list li .vip_ping.mid { color: #fbbf24; background: rgba(251, 191, 36, .14); }
                #${_CONFIG_.vipBoxId} .vip_list li .vip_ping.slow { color: #f87171; background: rgba(248, 113, 113, .14); }
                /* 最快线路标记 */
                #${_CONFIG_.vipBoxId} .vip_list li.vip_fastest {
                    border-color: rgba(74, 222, 128, .6);
                    box-shadow: inset 0 0 0 1px rgba(74, 222, 128, .35);
                }
                #${_CONFIG_.vipBoxId} .vip_list li.vip_fastest .vip_name::before { content: '⚡'; font-size: 10px; margin-right: 2px; }
                #${_CONFIG_.vipBoxId} .vip_list li:active { transform: scale(.97); }
                #${_CONFIG_.vipBoxId} .vip_list li:hover { color: #fff; border-color: rgba(139, 92, 246, .55); background: rgba(139, 92, 246, .14); }
                #${_CONFIG_.vipBoxId} .vip_list li.selected {
                    color: #fff; font-weight: 600;
                    border-color: rgba(196, 181, 253, .7);
                    background: linear-gradient(135deg, #6d28d9, #8b5cf6);
                    box-shadow: 0 3px 12px rgba(109, 40, 217, .4);
                }
                /* 使用必读（默认折叠，点开展开） */
                #${_CONFIG_.vipBoxId} .vip_notes { border-top: 1px solid rgba(148, 163, 184, .12); }
                #${_CONFIG_.vipBoxId} .vip_notes summary {
                    list-style: none; cursor: pointer; user-select: none;
                    display: flex; align-items: center; gap: 6px; padding: 9px 14px;
                    font-size: 11px; font-weight: 600; color: #94a3b8; transition: color .15s;
                }
                #${_CONFIG_.vipBoxId} .vip_notes summary::-webkit-details-marker { display: none; }
                #${_CONFIG_.vipBoxId} .vip_notes summary::before { content: '▸'; color: #64748b; font-size: 10px; transition: transform .18s; }
                #${_CONFIG_.vipBoxId} .vip_notes[open] summary::before { transform: rotate(90deg); }
                #${_CONFIG_.vipBoxId} .vip_notes summary:hover { color: #c4b5fd; }
                #${_CONFIG_.vipBoxId} .vip_notes_body { padding: 0 14px 11px; font-size: 10.5px; line-height: 1.8; color: #64748b; }
                #${_CONFIG_.vipBoxId} .vip_notes_body b { color: #94a3b8; font-weight: 600; }
                /* 移动端适配 */
                /* 失败率降级标记：低成功率源半透明 + 「低成功率」角标 */
                #${_CONFIG_.vipBoxId} .vip_list li.vip_demoted { opacity: .5; }
                #${_CONFIG_.vipBoxId} .vip_list li.vip_demoted .vip_name::after {
                    content: "低成功率"; font-size: 10px; font-weight: 600; font-style: normal;
                    color: #fbbf24; margin-left: 5px;
                }
                @media (max-width: 520px) {
                    #${_CONFIG_.vipBoxId} .vip_list { left: calc(100% + 8px); width: min(320px, calc(100vw - 64px)); max-height: 74vh; }
                    #${_CONFIG_.vipBoxId} .vip_sec_head h3 em, #${_CONFIG_.vipBoxId} .vip_panel_title em { display: none; }
                    #${_CONFIG_.vipBoxId} .vip_list ul { gap: 5px; }
                    #${_CONFIG_.vipBoxId} .vip_list li { height: 29px; line-height: 27px; font-size: 12px; }
                    #${_CONFIG_.vipBoxId} .vip_section { padding: 8px 10px 5px; }
                    #${_CONFIG_.vipBoxId} .vip_panel_head { padding: 10px 10px 9px; }
                }
            `);

            let type_1_str = "";
            let type_3_str = "";
            _CONFIG_.videoParseList.forEach((item, index) => {
                if (item.wsyzy) {
                    type_1_str += `<li class="nq-li" title="${item.name}（屏蔽欧美、欧洲线路）" data-index="${index}"><span class="vip_name">${item.name}</span><i class="vip_ping" data-index="${index}"></i></li>`;
                    return;
                }
                if (item.type.includes("1")) {
                    type_1_str += `<li class="nq-li" title="${item.name}" data-index="${index}"><span class="vip_name">${item.name}</span><i class="vip_ping" data-index="${index}"></i></li>`;
                }
                if (item.type.includes("3")) {
                    type_3_str += `<li class="tc-li" title="${item.name}" data-index="${index}"><span class="vip_name">${item.name}</span><i class="vip_ping" data-index="${index}"></i></li>`;
                }
            });

            let autoPlay = !!GM_getValue(_CONFIG_.autoPlayerKey, null) ? "开" : "关";

            $(container).append(`
                <div id="${_CONFIG_.vipBoxId}">
                    <div class="vip_icon">
                        <div class="img_box" title="选择解析源">VIP</div>
                        <div class="vip_list">
                            <div class="vip_panel_head">
                                <span class="vip_panel_title">视频解析中心<em>免费开源</em></span>
                                <button type="button" class="vip_speed_btn" title="对全部接口测速，按速度排序并标记最快线路">优选 ⚡</button>
                                <button type="button" class="vip_sponsor_btn" title="赞助支持脚本持续维护">赞助 💗</button>
                                <button type="button" class="vip_repo_btn" title="打开 GitHub 开源地址">仓库 ⭐</button>
                            </div>
                            <div class="vip_section">
                                <div class="vip_sec_head">
                                    <h3>内嵌播放<em>站内替换 · 带选集</em></h3>
                                </div>
                                <ul>${type_1_str}</ul>
                            </div>
                            <div class="vip_section">
                                <div class="vip_sec_head">
                                    <h3>弹窗播放<em>新标签页 · 不带选集</em></h3>
                                    <button type="button" class="vip_more_btn" title="查看脚本介绍与更多资源">更多 🎁</button>
                                    <button type="button" class="vip_web_btn" title="打开在线网页版解析">网页版 🌐</button>
                                </div>
                                <ul>${type_3_str}</ul>
                            </div>
                            <details class="vip_notes">
                                <summary>使用必读</summary>
                                <div class="vip_notes_body">
                                    <b>1.</b> 本脚本为开源项目，完全免费，请勿上当受骗；
                                    <br><b>2.</b> 视频内广告系资源自带，请勿轻信任何广告，可快进跳过；
                                    <br><b>3.</b> 无损云解析为资源采集模式，已屏蔽欧美、欧洲线路；
                                    <br><b>4.</b> 如遇卡顿/无法加载，可点击顶部「优选 ⚡」测速后选最快线路，或使用海外网络观看；
                                    <br><b>5.</b> 后续更新在 GitHub 仓库：88lin/video_vip；
                                    <br><b>6.</b> 资源均来自互联网公开分享，未提供资源上传、存储服务。
                                </div>
                            </details>
                        </div>
                    </div>
                    <div class="img_box${autoPlay === "开" ? " on" : ""}" id="vip_auto" title="自动解析开关。若自动解析失败，请手动选择其它接口尝试！">${autoPlay}</div>
                    <div class="img_box" id="vip_reload" title="刷新当前解析画面"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg></div>
                </div>`);
            parseStats.refreshMarks(); // 面板初次渲染即同步历史降级标记
            return new Promise((resolve, reject) => resolve(container));
        }

        reloadCurrentPlayer() {
            const iframe = document.querySelector(`.${_CONFIG_.iframeWrapperClass} iframe`);
            if (iframe && iframe.src) {
                iframe.src = iframe.src;
                return;
            }
            const selectedItem = document.querySelector(`#${_CONFIG_.vipBoxId} .vip_list .nq-li.selected`);
            if (!selectedItem) {
                return;
            }
            const index = parseInt(selectedItem.getAttribute("data-index"), 10);
            const videoObj = _CONFIG_.videoParseList[index];
            if (videoObj && videoObj.type.includes("1")) {
                this.showPlayerWindow(videoObj);
            }
        }

        // 优选：并发测速全部接口 → 徽标显示耗时 → 分区内按速度排序 → 标记最快内嵌线路
        async runSpeedTest(vipBox) {
            if (this._speedRunning) return;
            this._speedRunning = true;
            const btn = vipBox.find(".vip_speed_btn");
            const list = _CONFIG_.videoParseList;
            if (this._speedLabelTimer) clearTimeout(this._speedLabelTimer);
            btn.html("测速中…");
            vipBox.find(".vip_list li").removeClass("vip_fastest");
            vipBox.find(".vip_ping").removeClass("fast mid slow").text("…");

            const renderPing = (index, ms) => {
                const text = ms < 0 ? "超时" : ms + "ms";
                vipBox.find(`.vip_ping[data-index="${index}"]`).each((i, el) => {
                    el.textContent = text;
                    el.classList.remove("fast", "mid", "slow");
                    if (ms >= 0) {
                        el.classList.add(ms < 500 ? "fast" : (ms < 1200 ? "mid" : "slow"));
                    }
                });
                // 同一接口可能同时出现在内嵌/弹窗两个分区，标题一并更新
                vipBox.find(`.vip_list li[data-index="${index}"]`).each((i, el) => {
                    const item = list[index];
                    el.setAttribute("title", item.name + (item.wsyzy ? "（屏蔽欧美、欧洲线路）" : "") + " · " + text);
                });
            };

            try {
                const results = await Promise.all(list.map((item) => speedTest.probe(item)));
                results.forEach((ms, index) => renderPing(index, ms));

                // 分区内按耗时升序重排（失败沉底，同耗时保持原顺序）；data-index 不变，点击逻辑不受影响
                vipBox.find(".vip_list ul").each((ui, ul) => {
                    const lis = Array.prototype.slice.call(ul.querySelectorAll("li"));
                    lis.sort((a, b) => {
                        const ia = parseInt(a.getAttribute("data-index"), 10);
                        const ib = parseInt(b.getAttribute("data-index"), 10);
                        const va = results[ia] < 0 ? Infinity : results[ia];
                        const vb = results[ib] < 0 ? Infinity : results[ib];
                        if (va !== vb) return va - vb;
                        // 同耗时：低成功率源沉底，再按原顺序
                        const da = parseStats.degraded(list[ia].name) ? 1 : 0;
                        const db = parseStats.degraded(list[ib].name) ? 1 : 0;
                        return da !== db ? da - db : ia - ib;
                    });
                    lis.forEach((li) => ul.appendChild(li));
                });

                let bestIdx = -1;
                let bestMs = Infinity;
                list.forEach((item, index) => {
                    if (item.type.includes("1") && results[index] >= 0 && results[index] < bestMs) {
                        bestMs = results[index];
                        bestIdx = index;
                    }
                });
                if (bestIdx >= 0) {
                    vipBox.find(`.vip_list li[data-index="${bestIdx}"]`).addClass("vip_fastest");
                    btn.html(`⚡ ${list[bestIdx].name} ${bestMs}ms`);
                } else {
                    btn.html("全部超时");
                }
                this._speedLabelTimer = setTimeout(() => btn.html("优选 ⚡"), 2600);
            } catch (e) {
                btn.html("测速失败");
                this._speedLabelTimer = setTimeout(() => btn.html("优选 ⚡"), 2600);
            } finally {
                this._speedRunning = false;
            }
        }

        bindEvent(container) {
            const vipBox = $(`#${_CONFIG_.vipBoxId}`);
            if (_CONFIG_.isMobile) {
                vipBox.find(".vip_icon").on("click", () => vipBox.find(".vip_list").toggle());
            } else {
                const vipIcon = vipBox.find(".vip_icon");
                const vipList = vipBox.find(".vip_list");
                let vipListHideTimer = null;
                vipIcon.on("mouseenter", () => {
                    clearTimeout(vipListHideTimer);
                    vipList.show();
                });
                vipIcon.on("mouseleave", () => {
                    vipListHideTimer = setTimeout(() => vipList.hide(), 160);
                });
            }

            let _this = this;
            vipBox.find("#vip_reload").on("click", (event) => {
                event.stopPropagation();
                this.reloadCurrentPlayer();
            });
            vipBox.find(".vip_speed_btn").on("click", (event) => {
                event.stopPropagation();
                this.runSpeedTest(vipBox);
            });
            vipBox.find(".vip_repo_btn").on("click", (event) => {
                event.stopPropagation();
                GM_openInTab("https://github.com/88lin/video_vip/", {active: true, insert: true, setParent: true});
            });
            vipBox.find(".vip_sponsor_btn").on("click", (event) => {
                event.stopPropagation();
                GM_openInTab("https://blog.88lin.eu.org/coffee", {active: true, insert: true, setParent: true});
            });
            vipBox.find(".vip_more_btn").on("click", (event) => {
                event.stopPropagation();
                GM_openInTab("https://blog.88lin.eu.org/article/46", {active: true, insert: true, setParent: true});
            });
            vipBox.find(".vip_web_btn").on("click", (event) => {
                event.stopPropagation();
                GM_openInTab("https://go.88lin.eu.org/vip", {active: true, insert: true, setParent: true});
            });
            vipBox.find(".vip_list .nq-li").each((liIndex, item) => {
                item.addEventListener("click", () => {
                    const index = parseInt($(item).attr("data-index"));
                    _CONFIG_.manualPicked = true;
                    GM_setValue(_CONFIG_.autoPlayerVal, index);
                    GM_setValue(_CONFIG_.flag, "true");
                    _this.showPlayerWindow(_CONFIG_.videoParseList[index]);
                    vipBox.find(".vip_list li").removeClass("selected");
                    $(item).addClass("selected");
                });
            });
            vipBox.find(".vip_list .tc-li").each((liIndex, item) => {
                item.addEventListener("click", () => {
                    const index = parseInt($(item).attr("data-index"));
                    const videoObj = _CONFIG_.videoParseList[index];
                    _CONFIG_.manualPicked = true;
                    // 用户改走弹窗播放 → 退出接管状态，避免重挂守卫把站内播放器又挂回来
                    _CONFIG_.parsedMode = null;
                    _CONFIG_.lastSource = null;
                    if (_CONFIG_.directMode) {
                        // 移除页面内直连播放器，避免与弹窗播放双份声音
                        document.querySelectorAll('.' + _CONFIG_.iframeWrapperClass).forEach((node) => node.remove());
                    }
                    _CONFIG_.directMode = false;
                    wsyzyDirect.stop();
                    if (_CONFIG_.cleanupTimer) { clearInterval(_CONFIG_.cleanupTimer); _CONFIG_.cleanupTimer = null; }
                    let url = videoObj.url + window.location.href;
                    GM_openInTab(url, {active: true, insert: true, setParent: true});
                });
            });

            vipBox.mousedown(function (e) {
                if (e.which !== 3) {
                    return;
                }
                e.preventDefault()
                vipBox.css("cursor", "move");
                const positionDiv = $(this).offset();
                let distenceX = e.pageX - positionDiv.left;
                let distenceY = e.pageY - positionDiv.top;

                $(document).mousemove(function (e) {
                    let x = e.pageX - distenceX;
                    let y = e.pageY - distenceY;
                    const windowWidth = $(window).width();
                    const windowHeight = $(window).height();

                    if (x < 0) {
                        x = 0;
                    } else if (x > windowWidth - vipBox.outerWidth(true) - 100) {
                        x = windowWidth - vipBox.outerWidth(true) - 100;
                    }

                    if (y < 0) {
                        y = 0;
                    } else if (y > windowHeight - vipBox.outerHeight(true)) {
                        y = windowHeight - vipBox.outerHeight(true);
                    }
                    vipBox.css("left", x);
                    vipBox.css("top", y);
                });
                $(document).mouseup(function () {
                    $(document).off('mousemove');
                    // 拖拽结束后恢复右键菜单（此前永久禁用且反复绑定会累积 handler）
                    $(document).off('contextmenu');
                    vipBox.css("cursor", "pointer");
                });
                // 先解绑再绑定，避免多次拖拽后 handler 叠加
                $(document).off('contextmenu').contextmenu(function (e) {
                    e.preventDefault();
                })
            });
            return new Promise((resolve, reject) => resolve(container));
        }

        autoPlay(container) {
            const vipBox = $(`#${_CONFIG_.vipBoxId}`);
            vipBox.find("#vip_auto").on("click", function () {
                if (!!GM_getValue(_CONFIG_.autoPlayerKey, null)) {
                    GM_setValue(_CONFIG_.autoPlayerKey, null);
                    $(this).html("关").removeClass("on");
                    $(this).attr("title", "是否打开自动解析。若自动解析失败，请手动选择其它接口尝试！");
                } else {
                    GM_setValue(_CONFIG_.autoPlayerKey, "true");
                    $(this).html("开").addClass("on");
                }
                setTimeout(function () {
                    window.location.reload();
                }, 200);
            });

            if (!!GM_getValue(_CONFIG_.autoPlayerKey, null)) {
                this.selectPlayer();
            }
            return new Promise((resolve, reject) => resolve(container));
        }

        selectPlayer() {
            let index = GM_getValue(_CONFIG_.autoPlayerVal, 1);
            let autoObj = _CONFIG_.videoParseList[index];
            if (!autoObj || !autoObj.type.includes("1")) return;
            let _th = this;
            setTimeout(function () {
                // directMode/manualPicked 检查必须在定时器触发时进行：
                // 等待期间用户可能已手动点了直连或其他解析源，此时不应再自动播放
                // （既避免覆盖用户选择，也避免对同一源重复执行导致播放器重建）
                if (_CONFIG_.directMode || _CONFIG_.manualPicked) return;
                // 重新读取：以用户最后的选择为准
                let idx = GM_getValue(_CONFIG_.autoPlayerVal, 1);
                let obj = _CONFIG_.videoParseList[idx];
                if (!obj || !obj.type.includes("1")) return;
                // 失败率降级：上次选的源失败率过高 → 自动换成首个未降级的内嵌源（全部降级则维持原选）
                if (parseStats.degraded(obj.name)) {
                    const alt = _CONFIG_.videoParseList.findIndex((o, i) => i !== idx && o.type.includes("1") && !parseStats.degraded(o.name));
                    if (alt >= 0) {
                        console.log(`[失败率统计] 「${obj.name}」失败率过高，自动改用「${_CONFIG_.videoParseList[alt].name}」`);
                        idx = alt;
                        obj = _CONFIG_.videoParseList[idx];
                    }
                }
                _th.showPlayerWindow(obj);
                const vipBox = $(`#${_CONFIG_.vipBoxId}`);
                vipBox.find(`.vip_list [data-index="${idx}"]`).addClass("selected");
                vipBox.find("#vip_auto").attr("title", `自动解析源：${obj.name}`);
            }, 1500);
        }

        // 失败率降级：结束上一个源的在候判定。用户在窗口期内切到别的源 → 上一个源记失败
        settlePending(nextName) {
            const p = this._pending;
            if (!p) return;
            this._pending = null;
            if (p.timer) { clearTimeout(p.timer); p.timer = null; }
            if (nextName && nextName !== p.name) parseStats.record(p.name, false);
        }

        // 失败率降级：为刚嵌入的源开启判定窗口；超时未被切走则按 iframe 加载结果记录
        startPending(name, iframe) {
            let loaded = false;
            iframe.addEventListener('load', () => { loaded = true; });
            const timer = setTimeout(() => {
                if (this._pending && this._pending.name === name) {
                    this._pending = null;
                    parseStats.record(name, loaded);
                }
            }, 25000);
            this._pending = { name, timer };
        }

        showPlayerWindow(videoObj) {
            this.settlePending(videoObj.name);
            if (videoObj.wsyzy) {
                _CONFIG_.directMode = true;
                _CONFIG_.parsedMode = 'direct';
                _CONFIG_.lastSource = videoObj;
                wsyzyDirect.play().catch(e => console.warn('[无损云直连]', e.message));
                return;
            }
            _CONFIG_.directMode = false;
            _CONFIG_.parsedMode = 'iframe';
            _CONFIG_.lastSource = videoObj;
            wsyzyDirect.stop();   // 切回解析接口时停止直连模式的广告声抑制
            const embedGen = ++this._embedGen;
            util.findTargetEle(_CONFIG_.currentPlayerNode.container)
                .then((container) => {
                    if (embedGen !== this._embedGen) return; // 已有更新的嵌入请求（用户重新选源/守卫重挂）
                    const type = videoObj.type;
                    let url = videoObj.url + window.location.href;
                    if (type.includes("1")) {
                        const cleanupSelectors = [...new Set(((_CONFIG_.currentPlayerNode.displayNodes || []).concat(_CONFIG_.currentPlayerNode.cleanupNodes || [])).filter(Boolean))];
                        const cleanup = () => {
                            cleanupSelectors.forEach((selector) => {
                                document.querySelectorAll(selector).forEach((node) => {
                                    node.style.setProperty("display", "none", "important");
                                    node.style.setProperty("opacity", "0", "important");
                                    node.style.setProperty("pointer-events", "none", "important");
                                });
                            });
                        };
                        cleanup();
                        if (_CONFIG_.cleanupTimer) {
                            clearInterval(_CONFIG_.cleanupTimer);
                        }
                        _CONFIG_.cleanupTimer = setInterval(cleanup, 500);
                        if (!_CONFIG_.fullscreenCleanupBound) {
                            document.addEventListener("fullscreenchange", cleanup);
                            _CONFIG_.fullscreenCleanupBound = true;
                        }
                        const initialRect = container.getBoundingClientRect();
                        const initialStyle = window.getComputedStyle(container);
                        const frameLayout = buildPlayerFrameLayout({
                            isMobile: !!_CONFIG_.isMobile,
                            containerRect: initialRect,
                            containerStyle: {
                                paddingTop: initialStyle.paddingTop
                            },
                            viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0
                        });
                        $(container).empty();
                        util.reomveVideo();
                        if (initialStyle.position === "static") {
                            container.style.position = "relative";
                        }
                        applyInlineStyles(container, frameLayout.containerStyles);

                        const iframeWrapper = document.createElement("div");
                        iframeWrapper.className = _CONFIG_.iframeWrapperClass;
                        applyInlineStyles(iframeWrapper, frameLayout.wrapperStyles);

                        const iframe = document.createElement("iframe");
                        iframe.src = url;
                        iframe.frameBorder = "0";
                        iframe.allow = "autoplay; encrypted-media; fullscreen";
                        iframe.allowFullscreen = true;
                        iframe.referrerPolicy = "no-referrer";
                        applyInlineStyles(iframe, frameLayout.iframeStyles);

                        iframeWrapper.appendChild(iframe);
                        container.appendChild(iframeWrapper);
                        this.startPending(videoObj.name, iframe);
                        console.log('[解析接口] 嵌入解析源:', videoObj.name, url);
                        iframe.addEventListener('load', () => console.log('[解析接口] iframe 已加载:', videoObj.name));
                    }
                }).catch(() => {});
        }

        // ===== 切集自动跟随（v3.2.9.5）=====
        // 旧实现只有"URL 变 → 整页 reload"一条路，三类场景会失灵：
        //   1) 自动解析关（手动选源）时基本永远不跟（flag 机制形同虚设）；
        //   2) reload 又慢又易触发熔断，快切几集后跟随整体哑掉；
        //   3) 站点切集不改 URL（纯前端换集）→ 无人响应。
        // 现在的主路径：URL 变化且已接管 → 原地重新解析（直连 restart / 内嵌重建 iframe），
        // 自动与手动模式一致，不整页刷新；配合 startEpisodeWatch 监听标题集数漂移
        // （URL 未变的切集，直连模式）、startWrapperGuard 自动重挂被站点清掉的 wrapper、
        // 直连失败自动重试一次。整页 reload 仅保留给"自动开但尚未接管"的初始化场景。

        postHandle(container) {
            // 跟随主路径（v3.2.9.5）：URL 变化时若已接管播放器，原地重新解析
            // （直连重跑搜索、内嵌重建 iframe），自动/手动模式都生效且不整页刷新；
            // 仅"自动解析开但尚未接管"时才整页重载，由熔断器兜底防循环
            const latch = { done: false, followedEp: 0 };
            const navReload = () => {
                if (latch.done) return;
                // 熔断保险：30 秒内连续刷新 ≥3 次判定为异常循环（个别站点每次加载
                // 都会改写 URL），自动跟随直接停用，保住可看性
                try {
                    const key = 'vv_nav_reload_ts';
                    const now = Date.now();
                    const stamps = JSON.parse(sessionStorage.getItem(key) || '[]').filter(t => now - t < 30000);
                    if (stamps.length >= 3) {
                        latch.done = true;
                        toast('检测到刷新循环，已暂停切集自动跟随（可手动刷新页面恢复）', false);
                        return;
                    }
                    stamps.push(now);
                    sessionStorage.setItem(key, JSON.stringify(stamps));
                } catch (e) {
                }
                latch.done = true;
                window.location.reload();
            };
            util.onUrlChange(() => {
                if (latch.done) return;
                if (_CONFIG_.parsedMode === 'direct') {
                    latch.followedEp = curEpNum(); // 告知集数守卫：这集已由原地重解析跟上
                    wsyzyDirect.restart();
                } else if (_CONFIG_.parsedMode === 'iframe' && _CONFIG_.lastSource) {
                    latch.followedEp = curEpNum();
                    this.showPlayerWindow(_CONFIG_.lastSource);
                } else if (!!GM_getValue(_CONFIG_.autoPlayerKey, null)) {
                    navReload();
                }
            });
            this.startWrapperGuard(latch);
            this.startEpisodeWatch(latch);
        }

        // 守卫一：解析 wrapper 被官网重渲染清掉（querySelector 找不到）→ 自动重挂
        startWrapperGuard(latch) {
            let misses = 0;
            let lastFix = 0;
            const timer = setInterval(() => {
                if (latch.done) { clearInterval(timer); return; }
                if (!_CONFIG_.parsedMode) { misses = 0; return; }
                // 直连流程自会重挂 wrapper，跳过避免打架
                if (_CONFIG_.parsedMode === 'direct' && wsyzyDirect.busy()) { misses = 0; return; }
                if (document.querySelector('.' + _CONFIG_.iframeWrapperClass)) { misses = 0; return; }
                // 连续 2 秒缺失才动作，避开站点重建播放器的中间态
                if (++misses < 2) return;
                misses = 0;
                // 冷却 10 秒：站点若反复清容器，避免"挂上→被清→再挂"来回闪屏
                if (Date.now() - lastFix < 10000) return;
                lastFix = Date.now();
                if (_CONFIG_.parsedMode === 'direct') {
                    wsyzyDirect.restart();
                } else if (_CONFIG_.parsedMode === 'iframe' && _CONFIG_.lastSource) {
                    this.showPlayerWindow(_CONFIG_.lastSource);
                }
            }, 1000);
        }

        // 守卫二：URL 未变但标题里的集数变了（纯前端切集）→ 直连模式原地重新解析。
        // 接口内嵌模式以 URL 为解析依据，URL 未变时无法跟随，仅同步基线
        startEpisodeWatch(latch) {
            let lastEp = curEpNum();
            let candEp = 0; // 新集数需连续两次检测到才动作，滤掉标题瞬时抖动
            const timer = setInterval(() => {
                if (latch.done) { clearInterval(timer); return; }
                const ep = curEpNum();
                if (!ep) return; // 标题未就绪/无集数信息，保持基线
                // URL 变化那集已由 follow 原地重解析跟上：等到标题显示该集数就同步基线；
                // 若等到的是别的集数，说明用户又切了一集，走下面的漂移流程
                if (latch.followedEp) {
                    if (ep === latch.followedEp) {
                        latch.followedEp = 0;
                        lastEp = ep;
                        candEp = 0;
                        return;
                    }
                    if (ep === lastEp) return; // 标题还没更新到新集数，继续等
                    latch.followedEp = 0;
                }
                if (lastEp && ep !== lastEp) {
                    if (ep !== candEp) { candEp = ep; return; }
                    candEp = 0;
                    lastEp = ep;
                    if (_CONFIG_.parsedMode === 'direct') {
                        toast(`检测到切到第 ${ep} 集，重新解析...`, false);
                        wsyzyDirect.restart();
                    }
                } else {
                    lastEp = ep;
                    candEp = 0;
                }
            }, 1500);
        }

    }

    class DefaultConsumer extends BaseConsumer {
    }

    return {
        start: () => {
            GM_setValue(_CONFIG_.flag, null);
            // 一次性索引迁移：videoParseList 在 index 0 插入了「无损云解析」，老用户存储的索引需要 +1
            const migKey = 'wsyzy_idx_migrated_' + window.location.host;
            if (!GM_getValue(migKey, false)) {
                const oldVal = GM_getValue(_CONFIG_.autoPlayerVal, null);
                if (typeof oldVal === 'number' && oldVal >= 0) {
                    GM_setValue(_CONFIG_.autoPlayerVal, oldVal + 1);
                }
                GM_setValue(migKey, true);
            }
            let mallCase = 'Default';
            let playerNode = _CONFIG_.playerContainers.filter(value => value.host === window.location.host);
            if (playerNode === null || playerNode.length <= 0) {
                console.warn(window.location.host + "该网站暂不支持，请联系作者，作者将会第一时间处理（注意：请记得提供有问题的网址）");
                return;
            }
            _CONFIG_.currentPlayerNode = playerNode[0];
            mallCase = _CONFIG_.currentPlayerNode.name;
            // 全屏自动隐藏浮窗守卫（仅对已支持的站点生效，见函数注释）
            startFullscreenFloatGuard();
            const consumers = { Default: DefaultConsumer };
            const targetConsumer = new (consumers[mallCase] || DefaultConsumer)();
            targetConsumer.parse();
        }
    }

})();

(function () {
    superVip.start();
})();
