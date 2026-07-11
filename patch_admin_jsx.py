import re

with open('client/src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# I forgot to wrap the new filters div and the table div in a fragment/div.
content = content.replace(') : (\n          \n        <div className="flex flex-col md:flex-row gap-4 mb-6">', ') : (\n          <>\n        <div className="flex flex-col md:flex-row gap-4 mb-6">')

content = content.replace('</div>\n          </div>\n        )}', '</div>\n          </div>\n          </>\n        )}')

with open('client/src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)
