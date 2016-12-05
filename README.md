# vis2016
Web based post-processing image statistics for bidirectional path tracing.

Introduction :

This application is a web base tool that allows the user to visualize the different samples that
make up an image that was produced using path tracing. This allows the user to identify problematic
sample and remove them or alter them to fit their need.

In order to produce this tool we used vaious libraries:

  1) D3
  D3 is used to construct and manipulate the different display windows, and
  dianamically display relevant information.

  2) Jquery3.1.1
  Jquety is used here to make queries on the data we collected. For intance 
  when we want the samples associated with specific pixel.

  3) Cropper.js
  Cropper.js is library that allows us to cropped images. This enable us 
  cropped the region selected by the user.

On top of the Visual design a lot code has been develloped the solve the problem at hand.
  
  1) Automatic detection.
  We use the pixels intensities to automatically detect the outliers pixel.

  2) Pixel cleanse
  we implement a code that automatically fixed the outliers pixel, by double
  clicking on the pixel.


Our tools is reach of very useful tools and we have incule a brief description
of the different tools under each window. That user can use as guide for non
intuitive features.

Screen Cast URL :


Website URL :
https://wbppisbpt.github.io/


