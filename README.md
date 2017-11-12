# good-portraits
Artisan abstract portraits generated with hand-crafted code.

When technology and art combine, that is when society gets truly pushed forward. Andy Warhol pioneered the technique of leveraging technology to produce art _en masse_ to force consideration of what art even means, so I intend to continue this mission and reduce the meaning in art even more.

This script takes in a regular image and produces a high-quality, carefully thought-out portrait. It's abstract, which packs even more meaning into the image while I put even less thought into it.

Sometimes it gets too abstract, so you can pass in a command line flag to label things in the image for you so you can still tell what they are.

<img src="https://github.com/davepagurek/good-portraits/blob/master/out.jpg?raw=true" width="500" />
<em>"The turmoil of the soul", 2017</em>

<img src="https://github.com/davepagurek/good-portraits/blob/master/out2.jpg?raw=true" width="500" />
<em>"Life is meaningless", 2017</em>

## Setup
Install darknet as per the instructions here: https://github.com/moovel/node-yolo
```
curl -L http://pjreddie.com/media/files/yolo.weights > yolo.weights
yarn install
```

## Run the script
```
node index.js adam.jpg && open out.jpg
node index.js andrew3.jpg true && open out.jpg
```
