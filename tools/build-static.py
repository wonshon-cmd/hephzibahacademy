import re,sys,os,shutil
# Builds a static copy of the website (no server) for GitHub Pages or any static host.
#   python3 tools/build-static.py            -> writes docs/
# Live classes, sign-ups and applications need the Node server (server.js).
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pub=os.path.join(ROOT,'public'); dl=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else os.path.join(ROOT,'docs')
os.chdir(pub); os.makedirs(dl,exist_ok=True)
css=open('css/site.css').read(); livecss=open('css/live.css').read(); ptjs=open('js/personality-test.js').read(); pjson=open('data/personality.json').read().strip(); sitejs=open('js/site.js').read(); i18n=open('js/i18n.js').read()
deckjson=open('data/my-user-manual.json').read().strip()
pages={'index.html':'index.html','lectures.html':'lectures.html','support.html':'support.html','mentors.html':'mentors.html','apply.html':'apply.html','personality.html':'personality.html','cohort.html':'cohort.html','lectures/my-user-manual.html':'my-user-manual.html'}
def links(s):
    s=s.replace('href="/downloads/my-user-manual-slides.html" download','href="my-user-manual-slides.html"')
    s=re.sub(r'href="/cohort\?([^"]*)"',r'href="cohort.html?\1"',s)
    s=s.replace('href="/lectures/my-user-manual"','href="my-user-manual.html"')
    for k in ['lectures','support','mentors','apply','personality','cohort']: s=s.replace(f'href="/{k}"',f'href="{k}.html"')
    s=re.sub(r'href="/#([\w-]+)"',r'href="index.html#\1"',s)
    s=s.replace('href="/"','href="index.html"')
    s=re.sub(r'href="/(present|join)[^"]*"','href="#live-only"',s)
    s=s.replace('href="/favicon.svg"','href="data:image/svg+xml,'+open('favicon.svg').read().strip().replace('#','%23').replace('"',"'")+'"')
    s=s.replace('const deck = await (await fetch("/data/my-user-manual.json")).json();','const deck = '+deckjson+';')
    s=s.replace('fetch("/data/site.json")','fetch("site.json")')
    s=s.replace('<link rel="stylesheet" href="/css/live.css">','<style>\n'+livecss+'\n</style>')
    s=s.replace('<script src="/js/personality-test.js" defer></script>','<script>window.__PERSONALITY='+pjson+';</script>\n<script>'+ptjs+'</script>')
    s=s.replace('<link rel="stylesheet" href="/css/site.css">','<style>\n'+css+'\n.preview-note{position:fixed;left:16px;bottom:16px;z-index:50;background:var(--ink);color:var(--paper);padding:10px 14px;border-radius:8px;font-size:14px;max-width:calc(100vw - 32px)}\n</style>')
    s=s.replace('<script src="/js/i18n.js" defer></script>','<script>'+i18n+'</script>')
    s=s.replace('<script src="/js/site.js" defer></script>','<script>'+sitejs+'''
document.addEventListener("click",(e)=>{const a=e.target.closest('a[href="#live-only"]');if(!a)return;e.preventDefault();note("Live classes need the full site with its server.");});
document.addEventListener("submit",(e)=>{e.preventDefault();e.stopImmediatePropagation();note("This form needs the full site with its server.");},true);
function note(t){const K=window.hzI18n&&window.hzLang&&window.hzLang()==="ko"?window.hzI18n.KO[t]:null;let n=document.querySelector(".preview-note");if(!n){n=document.createElement("div");n.className="preview-note";n.setAttribute("role","status");document.body.append(n);}n.textContent=K||t;clearTimeout(n._t);n._t=setTimeout(()=>n.remove(),4000);}
</script>''')
    return s
for src,dst in pages.items():
    s=links(open(src).read())
    open(os.path.join(dl,dst),'w').write(s)
shutil.copy('downloads/my-user-manual-slides.html',dl)
shutil.copy('data/site.json',dl)
open(os.path.join(dl,'.nojekyll'),'w').write('')
open(os.path.join(dl,'404.html'),'w').write(links(open('404.html').read()))
print('ok')
