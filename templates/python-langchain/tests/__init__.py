import sys
from pathlib import Path

parent_dir = Path(__file__).parent
src_dir = parent_dir.parent / 'src'

sys.path.append(str(src_dir))
