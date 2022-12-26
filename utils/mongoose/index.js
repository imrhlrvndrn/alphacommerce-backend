const Wishlists = require('../../models/wishlists.model');
const { CustomError } = require('../index');

const mongooseSave = async (model) => await model.save();

const createWishlists = async (wishlists) => {
    let savedWishlists = [];

    wishlists.forEach(async (item) => {
        let newWishlist = null;
        const wishlistExists = await Wishlists.findOne({
            user: item.user,
            'name.name': item.name.name,
        });
        if (wishlistExists) {
            wishlistExists.name.duplicate_count += 1;
            const savedWishlist = await wishlistExists.save();
            if (!savedWishlist)
                throw new CustomError('500', 'failed', "Couldn't update the original wishlist");

            newWishlist = new Wishlists({
                ...item,
                name: {
                    name: `${item.name.name} (${wishlistExists.name.duplicate_count})`,
                    duplicate_count: 0,
                },
            });
        } else {
            newWishlist = new Wishlists(item);
        }

        const savedWishlist = await mongooseSave(newWishlist); // This function will just save to DB. Since Mongoose.Model.save() can't be executed in a loop
        savedWishlists = [...savedWishlists, newWishlist];
    });

    return savedWishlists;
};

module.exports = { createWishlists, mongooseSave };
