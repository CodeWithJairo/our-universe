Put starting photos in this folder using the exact photo-slot ID as the
filename, for example:

  p1.main.jpg
  p3.a.jpeg
  p9.b.webp

Supported extensions: jpg, jpeg, png, webp.

On first load, any empty slot whose matching file exists here is filled
automatically and saved into the browser's IndexedDB. Photos uploaded later
through the website take priority over these bundled files.
