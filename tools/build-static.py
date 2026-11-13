import re,sys,os,shutil
# Builds a static copy of the website (no server) for GitHub Pages or any static host.
#   python3 tools/build-static.py            -> writes docs/
# Live classes, sign-ups and applications need the Node server (server.js).
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pub=os.path.join(ROOT,'public'); dl=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else os.path.join(ROOT,'docs')
os.chdir(pub); os.makedirs(dl,exist_ok=True)
css=open('css/site.css').read(); livecss=open('css/live.css').read(); ptjs=open('js/personality-test.js').read(); pjson=open('data/personality.json').read().strip(); sitejs=open('js/site.js').read(); i18n=open('js/i18n.js').read()
deckjson=open('data/my-user-manual.json').read().strip()
pages={'index.html':'index.html','lectures.html':'lectures.html','support.html':'support.html','mentors.html':'mentors.html','speakers.html':'speakers.html','churches.html':'churches.html','apply.html':'apply.html','personality.html':'personality.html','cohort.html':'cohort.html','lectures/my-user-manual.html':'my-user-manual.html','lectures/basic-finance.html':'basic-finance.html'}
def links(s):
    s=s.replace('href="/downloads/my-user-manual-slides.html" download','href="my-user-manual-slides.html"')
    s=re.sub(r'href="/cohort\?([^"]*)"',r'href="cohort.html?\1"',s)
    s=s.replace('href="/lectures/my-user-manual"','href="my-user-manual.html"').replace('href="/lectures/basic-finance"','href="basic-finance.html"')

    for k in ['lectures','support','mentors','apply','personality','cohort','speakers','churches']: s=s.replace(f'href="/{k}"',f'href="{k}.html"')
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
    s=s.replace('<script src="/js/reviews.js" defer></script>','<script>window.__REVIEWS='+open('data/reviews.json').read().strip()+';</script>\n<script>'+open('js/reviews.js').read()+'</script>')
    s=s.replace('<script src="/js/site.js" defer></script>','<script>'+sitejs+'''
document.addEventListener("click",(e)=>{const a=e.target.closest('a[href="#live-only"]');if(!a)return;e.preventDefault();note("Live classes need the full site with its server.");});
document.addEventListener("submit",(e)=>{if(e.target.closest("#admin-form"))return;e.preventDefault();e.stopImmediatePropagation();note("This form needs the full site with its server.");},true);
function note(t){const K=window.hzI18n&&window.hzLang&&window.hzLang()==="ko"?window.hzI18n.KO[t]:null;let n=document.querySelector(".preview-note");if(!n){n=document.createElement("div");n.className="preview-note";n.setAttribute("role","status");document.body.append(n);}n.textContent=K||t;clearTimeout(n._t);n._t=setTimeout(()=>n.remove(),4000);}
</script>''')
    return s
for src,dst in pages.items():
    s=links(open(src).read())
    open(os.path.join(dl,dst),'w').write(s)
# Slides are never published in plain form on the static site.
for stale in ['my-user-manual-slides.html', 'basic-finance-slides.html']:
    if os.path.exists(os.path.join(dl, stale)): os.remove(os.path.join(dl, stale))
open(os.path.join(dl,'.nojekyll'),'w').write('')
# Custom domain for GitHub Pages (keep in sync with Settings → Pages)
open(os.path.join(dl,'CNAME'),'w').write('hephzibahacademy.org\n')
open(os.path.join(dl,'404.html'),'w').write(links(open('404.html').read()))

# Protected lectures: embed each slide deck encrypted with ADMIN_PASSCODE (never stored in the repo).
import subprocess
pw = os.environ.get('ADMIN_PASSCODE', '')
DECRYPT = """<script>
(() => {
  const ENC = __ENC__;
  const lang = () => (window.hzLang && window.hzLang()) || "en";
  document.querySelectorAll(".admin-only").forEach((n) => n.remove());
  const form = document.getElementById("admin-form"), err = form.querySelector(".error");
  document.getElementById("admin-open").onclick = () => { form.hidden = !form.hidden; if (!form.hidden) document.getElementById("admin-pw").focus(); };
  const b = (x) => Uint8Array.from(atob(x), (c) => c.charCodeAt(0));
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); err.textContent = "";
    if (!ENC) { err.textContent = lang() === "ko" ? "이 사이트에는 슬라이드가 없어요." : "Slides aren’t available on this site."; return; }
    try {
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(document.getElementById("admin-pw").value), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b(ENC.salt), iterations: ENC.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const html = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b(ENC.iv) }, key, b(ENC.ct));
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      form.replaceChildren(Object.assign(document.createElement("a"), { className: "btn", href: url, target: "_blank", textContent: lang() === "ko" ? "슬라이드 열기 →" : "Open slides →" }));
    } catch { err.textContent = lang() === "ko" ? "암호가 맞지 않아요." : "Incorrect password."; }
  });
})();
</script>"""
for lid in ['my-user-manual', 'basic-finance']:
    f = os.path.join(dl, lid + '.html'); page = open(f).read()
    tag = '<script src="/js/lecture-admin.js" data-deck="%s" defer></script>' % lid
    assert tag in page, lid
    enc = 'null'
    if pw:
        # Build a copy of the deck that includes private photos, then encrypt it.
        import tempfile
        tmp = os.path.join(tempfile.mkdtemp(), lid + '-slides.html')
        subprocess.run(['node', os.path.join(ROOT, 'tools', 'build-slides.mjs'), lid, tmp], env={**os.environ, 'INCLUDE_PRIVATE': '1'}, capture_output=True, check=True)
        enc = subprocess.run(['node', os.path.join(ROOT, 'tools', 'encrypt.mjs'), tmp], env={**os.environ}, capture_output=True, text=True, check=True).stdout
        os.remove(tmp)
    open(f, 'w').write(page.replace(tag, DECRYPT.replace('__ENC__', enc)))
# Public sample decks with a pretend class (demo mode), at /sample/<lecture>/ — no private photos.
for lid in ['my-user-manual', 'basic-finance']:
    out = os.path.join(dl, 'sample', lid, 'index.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    env = {k: v for k, v in os.environ.items() if k not in ('INCLUDE_PRIVATE',)}
    env['DEMO'] = '1'
    subprocess.run(['node', os.path.join(ROOT, 'tools', 'build-slides.mjs'), lid, out], env=env, capture_output=True, check=True)
# Growth Note demo app (self-contained page).
os.makedirs(os.path.join(dl, 'sample', 'growth-note'), exist_ok=True)
shutil.copyfile(os.path.join(pub, 'sample', 'growth-note', 'index.html'), os.path.join(dl, 'sample', 'growth-note', 'index.html'))
print('ok')
