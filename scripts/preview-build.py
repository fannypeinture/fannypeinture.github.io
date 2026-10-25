from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
dest=root/'dist'
dest.mkdir(exist_ok=True)
for p in root.iterdir():
    if p.is_file() and (p.suffix in ('.html','.xml','.txt') or p.name in ('CNAME','.nojekyll')):
        shutil.copyfile(p,dest/p.name)
for folder in ('assets','admin','content'):
    shutil.copytree(root/folder,dest/folder,dirs_exist_ok=True)
