import re

with open('client/src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# I put the useEffect before the variable declarations. I need to move it after.
content = content.replace("""  useEffect(() => {
     setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, dateFilter]);
""", "")

content = content.replace("""  const [dateFilter, setDateFilter] = useState('');""", """  const [dateFilter, setDateFilter] = useState('');\n  useEffect(() => {\n     setCurrentPage(1);\n  }, [searchTerm, statusFilter, paymentFilter, dateFilter]);""")

with open('client/src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)
