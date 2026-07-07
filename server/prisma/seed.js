"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const products = [
    {
        name: 'Chocolate Milk',
        description: 'Rich, creamy chocolate milk.',
        price: 99,
        category: 'Milkshake',
        stock: 100,
        images: JSON.stringify([
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e515a96de6ca581e89ee2_Shop-product-cup_1.webp',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e5150e05e18c255f70b1c_Shop-product-back_1.svg',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e515f8a6b1236299f2b17_pieces.png',
            '#d69766',
            '#fff'
        ])
    },
    {
        name: 'Strawberry Milk',
        description: 'Fresh and fruity strawberry milk.',
        price: 99,
        category: 'Milkshake',
        stock: 100,
        images: JSON.stringify([
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50cdb36e7db2c2ca3681_Shop-product-cup_2.webp',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50c4e61989bc963cf1b1_Shop-product-back_1.svg',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50d598cd58638dbad73d_pieces.png',
            '#d94b59',
            '#fff'
        ])
    },
    {
        name: 'Cookies & Cream',
        description: 'Delicious cookies and cream milkshake.',
        price: 109,
        category: 'Milkshake',
        stock: 100,
        images: JSON.stringify([
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/6784f8dd4cf9446e5030563d_cookies%26Cream_card_cup.webp',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/6784f6be638ec0f46af1327d_cookies%26Cream_card_back.svg',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/67c5bb342320ea03fe81283a_558_pieces-1.webp',
            '#439be4',
            '#fff'
        ])
    },
    {
        name: 'Peanut Butter Chocolate',
        description: 'Nutty peanut butter mixed with rich chocolate.',
        price: 119,
        category: 'Milkshake',
        stock: 100,
        images: JSON.stringify([
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/6784fc2b1b4361681f540c65_Peanutbutterchocolate_card_cup.webp',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/6784fc2634f4e82d81ad8d7b_Peanut%20butter%20chocolate_card_back.svg',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/6784fce5478942b1f4c98048_Peanut%20butter%20chocolate_card_additional.webp',
            '#eca049',
            '#fff'
        ])
    },
    {
        name: 'Vanilla Milkshake',
        description: 'Classic, smooth vanilla milkshake.',
        price: 89,
        category: 'Milkshake',
        stock: 100,
        images: JSON.stringify([
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50b22ad7e046f421bf69_Shop-product-cup_3.webp',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e5034822e237fb9f89d3f_Shop-product-back_3.svg',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e503f244fae7c3bd61131_pieces.png',
            '#e8d5a3',
            '#a08040'
        ])
    },
    {
        name: 'Max Chocolate Milk',
        description: 'Extra dark, extra rich chocolate milk.',
        price: 129,
        category: 'Milkshake',
        stock: 100,
        images: JSON.stringify([
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50f26a9a9b40ec9058de_Shop-product-cup_4.webp',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50e5c4d66d476164b4ae_Shop-product-back_4.svg',
            'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50f43ac4bddacd084a9f_pieces.png',
            '#2b1b14',
            '#fff'
        ])
    }
];
async function main() {
    console.log('Seeding products...');
    for (const product of products) {
        await prisma.product.create({
            data: product,
        });
    }
    console.log('Seeding complete!');
}
main()
    .catch((e) => {
    console.error(e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map