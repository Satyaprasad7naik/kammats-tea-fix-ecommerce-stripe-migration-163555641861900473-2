with open("client/src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("import ShopPage from \"./pages/ShopPage\";", "import ShopPage from \"./pages/ShopPage\";\nimport ProductPage from \"./pages/ProductPage\";")
content = content.replace("<Route path=\"/shop\" element={<ShopPage />} />", "<Route path=\"/shop\" element={<ShopPage />} />\n                            <Route path=\"/product/:slug\" element={<ProductPage />} />")

with open("client/src/App.tsx", "w") as f:
    f.write(content)
