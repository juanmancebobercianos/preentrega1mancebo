const express = require('express');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 8080;

app.use(express.json());

const productsFilePath = 'productos.json';
const cartFilePath = 'carrito.json';

// Función para leer los datos de un archivo JSON
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe o hay un error al leerlo, retornar un array vacío
        return [];
    }
}

// Función para escribir los datos en un archivo JSON
async function writeData(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Rutas para productos
app.get('/api/products', async (req, res) => {
    const products = await readData(productsFilePath);
    res.json(products);
});

app.get('/api/products/:pid', async (req, res) => {
    const products = await readData(productsFilePath);
    const productId = req.params.pid;
    const product = products.find(p => p.id === productId);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.post('/api/products', async (req, res) => {
    const { title, description, code, price, stock, category, thumbnails } = req.body;
    if (!title || !description || !code || !price || !stock || !category) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const newProduct = {
        id: uuidv4(),
        title,
        description,
        code,
        price,
        status: true,
        stock,
        category,
        thumbnails: thumbnails || []
    };

    let products = await readData(productsFilePath);
    products.push(newProduct);
    await writeData(productsFilePath, products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:pid', async (req, res) => {
    const { title, description, code, price, stock, category, thumbnails } = req.body;
    const productId = req.params.pid;
    let products = await readData(productsFilePath);
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        products[productIndex] = {
            ...products[productIndex],
            title,
            description,
            code,
            price,
            stock,
            category,
            thumbnails
        };
        await writeData(productsFilePath, products);
        res.json(products[productIndex]);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.delete('/api/products/:pid', async (req, res) => {
    const productId = req.params.pid;
    let products = await readData(productsFilePath);
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        products.splice(productIndex, 1);
        await writeData(productsFilePath, products);
        res.json({ message: 'Product deleted successfully' });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Rutas para carritos
app.get('/api/carts/:cid', async (req, res) => {
    const cartId = req.params.cid;
    const carts = await readData(cartFilePath);
    const cart = carts.find(c => c.id === cartId);
    if (cart) {
        res.json(cart);
    } else {
        res.status(404).json({ message: 'Cart not found' });
    }
});

app.post('/api/carts', async (req, res) => {
    const newCart = {
        id: uuidv4(),
        products: []
    };
    let carts = await readData(cartFilePath);
    carts.push(newCart);
    await writeData(cartFilePath, carts);
    res.status(201).json(newCart);
});

app.post('/api/carts/:cid/product/:pid', async (req, res) => {
    const cartId = req.params.cid;
    const productId = req.params.pid;
    let carts = await readData(cartFilePath);
    const cartIndex = carts.findIndex(c => c.id === cartId);
    const productIndex = carts[cartIndex].products.findIndex(p => p.product === productId);
    if (cartIndex !== -1 && productIndex !== -1) {
        carts[cartIndex].products[productIndex].quantity++;
    } else if (cartIndex !== -1) {
        carts[cartIndex].products.push({ product: productId, quantity: 1 });
    } else {
        return res.status(404).json({ message: 'Cart or Product not found' });
    }
    await writeData(cartFilePath, carts);
    res.status(201).json(carts[cartIndex]);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
