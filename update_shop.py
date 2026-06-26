with open("client/src/pages/ShopPage.tsx", "r") as f:
    content = f.read()

content = content.replace("<div ref={cardRef} className=\"shop-card relative flex flex-col overflow-hidden rounded-2xl cursor-pointer group\" style={{ backgroundColor: color || '#d69766', aspectRatio: '3 / 4' }} onClick={() => navigate(`/product/${product.slug}`)}>", "<div ref={cardRef} className=\"shop-card relative flex flex-col overflow-hidden rounded-2xl cursor-pointer group\" style={{ backgroundColor: color || '#d69766', aspectRatio: '3 / 4' }} onClick={() => navigate(`/product/${product.slug}`)}>")

with open("client/src/pages/ShopPage.tsx", "w") as f:
    f.write(content)
