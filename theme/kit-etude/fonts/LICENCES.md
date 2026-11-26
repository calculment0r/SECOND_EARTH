# Les polices du script : licences

Les trois polices de lecture du panneau de script (réglage « Aa ») sont libres, sous
**SIL Open Font License 1.1** (OFL). Elles sont servies par notre Worker depuis
`public/fonts/`, jamais depuis un CDN. Fichiers woff2 pris tels quels dans les paquets npm
Fontsource (`@fontsource/courier-prime` 5.3.0, `@fontsource-variable/literata` 5.3.0,
`@fontsource-variable/atkinson-hyperlegible-next` 5.3.0), sous-ensembles « latin » et
« latin-ext » de Google Fonts (le « latin » porte déjà les accents français, œ, les
guillemets et les tirets ; le « latin-ext » n'est demandé que si un caractère l'exige).

| Police | Fichiers | Graisses | Droits |
|---|---|---|---|
| Courier Prime | `courier-prime-*.woff2` (8) | 400, 700, et leurs italiques | Copyright 2015 The Courier Prime Project Authors (https://github.com/quoteunquoteapps/CourierPrime) |
| Literata | `literata-*-wght-*.woff2` (4, variables) | axe wght 200 à 900, romain et italique | Copyright 2017 The Literata Project Authors (https://github.com/googlefonts/literata) |
| Atkinson Hyperlegible Next | `atkinson-hyperlegible-next-*-wght-*.woff2` (4, variables) | axe wght 200 à 800, romain et italique | Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors (https://github.com/googlefonts/atkinson-hyperlegible-next) |

**L'export PDF du script** (`src/lib/scenario-pdf.ts`) embarque Courier Prime dans le fichier : un PDF veut les tables
TrueType, pas un woff2. `courier-prime-latin-400-normal.ttf`, `-700-normal.ttf` et `-400-italic.ttf` sont les `.woff` du même
paquet (`@fontsource/courier-prime` 5.3.0, sous-ensemble « latin ») dont l'enveloppe WOFF est seulement retirée
(`scripts/scenario-polices-ttf.mjs` : chaque table décompressée telle quelle, aucun glyphe touché).

Aucune de ces polices n'est modifiée ni renommée ; elles ne sont pas vendues seules.
Le texte de la licence, commun aux trois, suit.

```
This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```
