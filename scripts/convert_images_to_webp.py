#!/usr/bin/env python3
"""
Convierte y comprime imágenes pesadas (.png, .jpg, .jpeg) en public/img a formato .webp
usando Pillow, con soporte para dry-run, redimensionamiento máximo y actualización de referencias.

Ejemplos de uso:
  1) Simulación (no modifica nada, muestra qué archivos convertiría):
     python scripts/convert_images_to_webp.py

  2) Convertir imágenes >= 200 KB a .webp (mantiene originales):
     python scripts/convert_images_to_webp.py --apply

  3) Convertir, actualizar rutas en src/ e index.html y borrar originales:
     python scripts/convert_images_to_webp.py --apply --update-refs --delete-originals
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys

from PIL import Image, ImageOps

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
CODE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".css", ".html"}


def format_mb(num_bytes: int) -> str:
    return f"{num_bytes / (1024 * 1024):.2f} MB"


def collect_images(
    img_dir: Path,
    min_bytes: int,
    include_prototipo: bool,
) -> list[Path]:
    files: list[Path] = []
    for path in sorted(img_dir.rglob("*")):
        if not path.is_file():
            continue
        if not include_prototipo and "prototipo" in path.parts:
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        if path.stat().st_size < min_bytes:
            continue
        files.append(path)
    return files


def convert_image(
    src_path: Path,
    quality: int,
    max_width: int,
    apply: bool,
) -> tuple[bool, int, int, str]:
    """
    Retorna (converted, original_bytes, new_bytes_or_est, message).
    """
    orig_bytes = src_path.stat().st_size
    dest_path = src_path.with_suffix(".webp")

    if not apply:
        return True, orig_bytes, 0, f"[DRY-RUN] {src_path} -> {dest_path.name} ({format_mb(orig_bytes)})"

    with Image.open(src_path) as img:
        img = ImageOps.exif_transpose(img)

        has_alpha = img.mode in ("RGBA", "LA") or (
            img.mode == "P" and "transparency" in img.info
        )
        target_mode = "RGBA" if has_alpha else "RGB"
        if img.mode != target_mode:
            img = img.convert(target_mode)

        if max_width > 0 and img.width > max_width:
            ratio = max_width / img.width
            new_height = max(1, round(img.height * ratio))
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        tmp_path = dest_path.with_suffix(".webp.tmp")
        img.save(
            tmp_path,
            format="WEBP",
            quality=quality,
            method=6,
        )

    new_bytes = tmp_path.stat().st_size
    if new_bytes >= orig_bytes:
        tmp_path.unlink(missing_ok=True)
        return (
            False,
            orig_bytes,
            orig_bytes,
            f"[OMITIDO] {src_path.name}: el .webp ({format_mb(new_bytes)}) no es menor que el original ({format_mb(orig_bytes)})",
        )

    os.replace(tmp_path, dest_path)
    saved_pct = (1 - (new_bytes / orig_bytes)) * 100
    return (
        True,
        orig_bytes,
        new_bytes,
        f"[OK] {src_path.name} -> {dest_path.name} | {format_mb(orig_bytes)} -> {format_mb(new_bytes)} (-{saved_pct:.1f}%)",
    )


def update_code_references(
    project_root: Path,
    converted_files: list[Path],
    public_dir: Path,
) -> int:
    replacements: list[tuple[str, str]] = []
    for src_path in converted_files:
        rel_old = "/" + src_path.relative_to(public_dir).as_posix()
        rel_new = "/" + src_path.with_suffix(".webp").relative_to(public_dir).as_posix()
        replacements.append((rel_old, rel_new))

    if not replacements:
        return 0

    targets: list[Path] = []
    src_dir = project_root / "src"
    if src_dir.exists():
        targets.extend(
            p for p in src_dir.rglob("*") if p.is_file() and p.suffix.lower() in CODE_EXTENSIONS
        )
    index_html = project_root / "index.html"
    if index_html.is_file():
        targets.append(index_html)

    updated_files = 0
    for code_file in targets:
        try:
            content = code_file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        new_content = content
        for old_ref, new_ref in replacements:
            new_content = new_content.replace(old_ref, new_ref)

        if new_content != content:
            code_file.write_text(new_content, encoding="utf-8")
            updated_files += 1
            print(f"[REF] Actualizado: {code_file.relative_to(project_root)}")

    return updated_files


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convierte y comprime imágenes pesadas de public/img a WebP."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Ejecuta la conversión real. Sin esta bandera corre en modo simulación (dry-run).",
    )
    parser.add_argument(
        "--min-kb",
        type=int,
        default=200,
        help="Tamaño mínimo en KB para convertir (por defecto: 200).",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=82,
        help="Calidad WebP de 1 a 100 (por defecto: 82).",
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=1920,
        help="Ancho máximo en píxeles; 0 desactiva el redimensionado (por defecto: 1920).",
    )
    parser.add_argument(
        "--delete-originals",
        action="store_true",
        help="Elimina el .png/.jpg/.jpeg original solo si el .webp se generó y pesa menos.",
    )
    parser.add_argument(
        "--update-refs",
        action="store_true",
        help="Actualiza las rutas /img/... en src/ e index.html hacia .webp.",
    )
    parser.add_argument(
        "--include-prototipo",
        action="store_true",
        help="Incluye public/prototipo (excluido por defecto).",
    )
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent.parent
    public_dir = project_root / "public"
    search_root = public_dir if args.include_prototipo else public_dir / "img"

    if not search_root.exists():
        print(f"No existe la carpeta objetivo: {search_root}", file=sys.stderr)
        return 1

    images = collect_images(
        search_root,
        min_bytes=args.min_kb * 1024,
        include_prototipo=args.include_prototipo,
    )

    if not images:
        print(f"No se encontraron imágenes >= {args.min_kb} KB en {search_root}.")
        return 0

    print(
        f"Encontradas {len(images)} imágenes >= {args.min_kb} KB en "
        f"{search_root.relative_to(project_root)} "
        f"(modo: {'APLICAR' if args.apply else 'SIMULACIÓN'})."
    )

    converted_files: list[Path] = []
    total_orig = 0
    total_new = 0

    for img_path in images:
        ok, orig_b, new_b, msg = convert_image(
            img_path,
            quality=args.quality,
            max_width=args.max_width,
            apply=args.apply,
        )
        print(msg)
        total_orig += orig_b
        if args.apply:
            total_new += new_b if ok else orig_b
            if ok:
                converted_files.append(img_path)

    if not args.apply:
        print(f"\nTotal candidato: {format_mb(total_orig)}")
        print("Para ejecutar la conversión real, corre:")
        print("  python scripts/convert_images_to_webp.py --apply --update-refs --delete-originals")
        return 0

    print(
        f"\nResumen: {len(converted_files)}/{len(images)} convertidas | "
        f"{format_mb(total_orig)} -> {format_mb(total_new)} "
        f"(ahorro: {format_mb(total_orig - total_new)})"
    )

    if args.update_refs and converted_files:
        updated_count = update_code_references(project_root, converted_files, public_dir)
        print(f"Referencias actualizadas en {updated_count} archivos de código.")

    if args.delete_originals and converted_files:
        for orig in converted_files:
            orig.unlink(missing_ok=True)
        print(f"Eliminados {len(converted_files)} archivos originales.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
