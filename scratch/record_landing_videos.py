import os
import time
import subprocess
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
FFMPEG = r"C:\Users\kevin\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"

TEMP_DIR = os.path.abspath("scratch/recordings")
OUTPUT_DIR = os.path.abspath("public/video/landing")
POSTER_DIR = os.path.abspath("public/prototipo/assets/img/general")

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(POSTER_DIR, exist_ok=True)

def smooth_scroll(page, y_target, steps=25, delay=0.03):
    current_y = page.evaluate("window.scrollY")
    diff = y_target - current_y
    for i in range(1, steps + 1):
        step_y = current_y + (diff * (i / steps))
        page.evaluate(f"window.scrollTo(0, {step_y})")
        time.sleep(delay)

def convert_to_mp4(webm_path, mp4_path, poster_path, duration=None):
    cmd = [
        FFMPEG, "-y",
        "-i", webm_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
    ]
    if duration:
        cmd.extend(["-t", str(duration)])
    cmd.append(mp4_path)
    
    print(f"Converting {webm_path} -> {mp4_path}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFmpeg error:", res.stderr)
        raise RuntimeError("FFmpeg conversion failed")
    
    # Extract high-res poster (frame at 3s or 1s)
    poster_cmd = [
        FFMPEG, "-y",
        "-ss", "00:00:03",
        "-i", mp4_path,
        "-vframes", "1",
        "-q:v", "2",
        "-vf", "scale=1600:-1",
        poster_path
    ]
    subprocess.run(poster_cmd, capture_output=True)
    print(f"Saved poster: {poster_path}")

def record_video_1(playwright):
    print("--- RECORDING VIDEO 1: PLAYLISTS ---")
    rec_dir = os.path.join(TEMP_DIR, "v1")
    os.makedirs(rec_dir, exist_ok=True)
    
    browser = playwright.chromium.launch(executable_path=CHROME_EXE, headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        record_video_dir=rec_dir,
        record_video_size={"width": 1440, "height": 900}
    )
    page = context.new_page()
    
    # Scene 1: Playlists list & spinning vinyl
    page.goto(f"{BASE_URL}/playlists", wait_until="networkidle")
    time.sleep(2)
    smooth_scroll(page, 200, 20, 0.04)
    time.sleep(2)
    
    # Switch tabs
    try:
        page.click("button:has-text('Guardadas')")
        time.sleep(2.5)
        page.click("button:has-text('Creadas por ti')")
        time.sleep(2.5)
        page.click("button:has-text('Todas')")
        time.sleep(2)
    except Exception:
        pass
    
    # Scene 2: Open detailed playlist (click first playlist card or vinyl)
    try:
        cards = page.query_selector_all(".plx-card, .plx-card-btn, button[aria-label*='playlist'], button:has(.animate-spin-vinyl)")
        if cards:
            cards[0].click()
            time.sleep(3)
        else:
            page.goto(f"{BASE_URL}/playlists/1", wait_until="networkidle")
            time.sleep(3)
    except Exception:
        page.goto(f"{BASE_URL}/playlists/1", wait_until="networkidle")
        time.sleep(3)
    
    smooth_scroll(page, 450, 25, 0.04)
    time.sleep(3)
    smooth_scroll(page, 100, 20, 0.03)
    time.sleep(2)
    
    # Scene 3: Go to Catalog to show adding garments
    page.goto(f"{BASE_URL}/catalogo", wait_until="networkidle")
    time.sleep(2)
    smooth_scroll(page, 350, 20, 0.04)
    time.sleep(3)
    smooth_scroll(page, 700, 25, 0.04)
    time.sleep(3)
    
    # Scene 4: Open Mapa to show store locations for outfits
    page.goto(f"{BASE_URL}/mapa", wait_until="networkidle")
    time.sleep(3)
    smooth_scroll(page, 250, 20, 0.04)
    time.sleep(3)
    
    context.close()
    browser.close()
    
    # Find generated webm
    webms = [os.path.join(rec_dir, f) for f in os.listdir(rec_dir) if f.endswith(".webm")]
    if webms:
        latest = max(webms, key=os.path.getmtime)
        mp4_out = os.path.join(OUTPUT_DIR, "video-1.mp4")
        poster_out = os.path.join(POSTER_DIR, "lk1.jpg")
        convert_to_mp4(latest, mp4_out, poster_out, duration=60)

def record_video_2(playwright):
    print("--- RECORDING VIDEO 2: PROBADOR VIRTUAL ---")
    rec_dir = os.path.join(TEMP_DIR, "v2")
    os.makedirs(rec_dir, exist_ok=True)
    
    browser = playwright.chromium.launch(executable_path=CHROME_EXE, headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        record_video_dir=rec_dir,
        record_video_size={"width": 1440, "height": 900}
    )
    page = context.new_page()
    
    # Scene 1: Probador virtual landing
    page.goto(f"{BASE_URL}/probador", wait_until="networkidle")
    time.sleep(2)
    smooth_scroll(page, 150, 15, 0.03)
    time.sleep(2)
    
    # Scene 2: Toggle silhouette perspectives (Frente, Lado, Espalda)
    try:
        page.click("button:has-text('Lado')")
        time.sleep(2.5)
        page.click("button:has-text('Espalda')")
        time.sleep(2.5)
        page.click("button:has-text('Frente')")
        time.sleep(2)
    except Exception:
        pass
        
    # Toggle gender / silhouette types if buttons exist
    try:
        btns = page.query_selector_all("button:has-text('Mujer'), button:has-text('Hombre')")
        if btns:
            btns[0].click()
            time.sleep(2)
    except Exception:
        pass
        
    # Scene 3: Garment selector panel
    try:
        sel_btn = page.query_selector("button:has-text('Escoger prenda'), button:has-text('Probar prenda'), button:has-text('Seleccionar prenda')")
        if sel_btn:
            sel_btn.click()
            time.sleep(3)
            # Pick a garment in the panel
            g_cards = page.query_selector_all("button[aria-label*='Probar'], .sr-item-card, li button")
            if g_cards:
                g_cards[0].click()
                time.sleep(2.5)
    except Exception:
        pass
        
    smooth_scroll(page, 300, 20, 0.04)
    time.sleep(3)
    
    # Scene 4: Body measurements wizard modal
    try:
        meas_btn = page.query_selector("button:has-text('Ajustar medidas'), button:has-text('Mis medidas'), button:has-text('Configurar cuerpo')")
        if meas_btn:
            meas_btn.click()
            time.sleep(3)
            close_btn = page.query_selector("button[aria-label*='Cerrar'], button:has-text('Cerrar'), button:has-text('Guardar')")
            if close_btn:
                close_btn.click()
                time.sleep(1.5)
    except Exception:
        pass
        
    # Scene 5: Advanced try-on
    page.goto(f"{BASE_URL}/probador/avanzado", wait_until="networkidle")
    time.sleep(3)
    smooth_scroll(page, 200, 20, 0.04)
    time.sleep(2)
    
    context.close()
    browser.close()
    
    webms = [os.path.join(rec_dir, f) for f in os.listdir(rec_dir) if f.endswith(".webm")]
    if webms:
        latest = max(webms, key=os.path.getmtime)
        mp4_out = os.path.join(OUTPUT_DIR, "video-2.mp4")
        poster_out = os.path.join(POSTER_DIR, "ref.jpg")
        convert_to_mp4(latest, mp4_out, poster_out, duration=58)

def record_video_3(playwright):
    print("--- RECORDING VIDEO 3: QUIÉNES SOMOS & PLATAFORMA ---")
    rec_dir = os.path.join(TEMP_DIR, "v3")
    os.makedirs(rec_dir, exist_ok=True)
    
    browser = playwright.chromium.launch(executable_path=CHROME_EXE, headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        record_video_dir=rec_dir,
        record_video_size={"width": 1440, "height": 900}
    )
    page = context.new_page()
    
    # Scene 1: Landing page presentation & Hero
    page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
    time.sleep(3)
    smooth_scroll(page, 400, 20, 0.03)
    time.sleep(2)
    smooth_scroll(page, 900, 25, 0.03)
    time.sleep(2)
    
    # Scene 2: Interactive Map of Bogota
    page.goto(f"{BASE_URL}/mapa", wait_until="domcontentloaded")
    time.sleep(3)
    smooth_scroll(page, 200, 15, 0.03)
    time.sleep(2)
    
    # Scene 3: Segunda Mano & Donaciones
    page.goto(f"{BASE_URL}/segunda-mano", wait_until="domcontentloaded")
    time.sleep(3)
    # Switch to Vitrina de Donaciones ($0) tab
    try:
        page.click("button:has-text('Vitrina de Donaciones')")
        time.sleep(3)
    except Exception:
        pass
    smooth_scroll(page, 300, 20, 0.04)
    time.sleep(2)
    
    # Scene 4: Planes & Memberships
    page.goto(f"{BASE_URL}/planes", wait_until="domcontentloaded")
    time.sleep(3)
    smooth_scroll(page, 350, 20, 0.04)
    time.sleep(2)
    
    # Back to Landing with theme toggle demonstration
    page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
    time.sleep(3)
    
    context.close()
    browser.close()
    
    webms = [os.path.join(rec_dir, f) for f in os.listdir(rec_dir) if f.endswith(".webm")]
    if webms:
        latest = max(webms, key=os.path.getmtime)
        mp4_out = os.path.join(OUTPUT_DIR, "video-3.mp4")
        poster_out = os.path.join(POSTER_DIR, "about.jpg")
        convert_to_mp4(latest, mp4_out, poster_out, duration=60)

if __name__ == "__main__":
    with sync_playwright() as p:
        # record_video_1(p)  # already generated
        # record_video_2(p)  # already generated
        record_video_3(p)
    print("ALL 3 VIDEOS AND POSTERS GENERATED SUCCESSFULLY!")
