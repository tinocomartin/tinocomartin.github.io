---
layout: page
title: Contacto
permalink: /contacto/
description: "Sigue el trabajo fotográfico de José Antonio Tinoco Martín en redes sociales."
---
{% assign redes = site.redes | where_exp: "r", "r.url != ''" %}

{% if redes.size > 0 %}
<p>Puedes seguir mi trabajo y escribirme a través de mis redes:</p>

<ul class="social-list">
{%- for r in redes %}
<li><a href="{{ r.url }}" target="_blank" rel="noopener">{{ r.nombre }}</a></li>
{%- endfor %}
</ul>
{% else %}
<p>Muy pronto encontrarás aquí los enlaces a mis perfiles en redes sociales, donde podrás seguir mi trabajo y escribirme.</p>
{% endif %}
