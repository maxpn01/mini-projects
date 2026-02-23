/* CONCEPTUAL IMPLEMENTATION */

enum ProductName {
  ProductA = "ProductA",
  ProductB = "ProductB",
  ProductC = "ProductC",
  Empty = "",
}

interface IProduct {
  name: ProductName;
}

class Product implements IProduct {
  name = ProductName.Empty;
}

class ProductA extends Product {
  constructor() {
    super();
    this.name = ProductName.ProductA;
  }
}

class ProductB extends Product {
  constructor() {
    super();
    this.name = ProductName.ProductB;
  }
}

class ProductC extends Product {
  constructor() {
    super();
    this.name = ProductName.ProductC;
  }
}

class Factory {
  static createProduct(type: ProductName): IProduct {
    if (type === ProductName.ProductA) {
      return new ProductA();
    } else if (type === ProductName.ProductB) {
      return new ProductB();
    } else {
      return new ProductC();
    }
  }
}

const product = Factory.createProduct(ProductName.ProductA);

console.log(product);

/* PRACTICE - IMPLEMENT ENEMY FACTORY */

interface IEnemy {
  hp: number;
  damage: number;
}

abstract class Enemy implements IEnemy {
  constructor(public hp: number, public damage: number) {}
}

class EnemyGoblin extends Enemy {
  constructor(level: number) {
    super(10 + level * 2, 2 + level);
  }
}

class EnemyOrc extends Enemy {
  constructor(level: number) {
    super(15 + level * 2, 5 + level);
  }
}

class EnemyDarkKnight extends Enemy {
  constructor(level: number) {
    super(30 + level * 2, 10 + level);
  }
}

class EnemyFactory {
  static createEnemy(level: number): IEnemy {
    if (level < 5) return new EnemyGoblin(level);
    if (level < 10) return new EnemyOrc(level);

    return new EnemyDarkKnight(level); // level > 10
  }
}

const enemy = EnemyFactory.createEnemy(11);

console.log(enemy);
