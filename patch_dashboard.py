import re

with open('templates/dashboard.html', 'r') as f:
    content = f.read()

content = content.replace("""<div class="row">
        <p class="text-muted">Welcome back, {{ session.name }}!</p>
    </div>
</div>

<div class="row">""", """<div class="row">""")

with open('templates/dashboard.html', 'w') as f:
    f.write(content)
