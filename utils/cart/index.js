const getVariantPrice = (arraySet, variantType = 'paperback') =>
    arraySet.find((item) => item.type === variantType).price;

module.exports = { getVariantPrice };
