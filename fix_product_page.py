with open("client/src/pages/ProductPage.tsx", "r") as f:
    content = f.read()

content = content.replace("const [image1, image2, image3, color, textColor] = product.images;", "const [image1, image2, image3, color] = product.images;")

with open("client/src/pages/ProductPage.tsx", "w") as f:
    f.write(content)
