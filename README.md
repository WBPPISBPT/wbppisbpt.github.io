## Web Based Post-Processing Image Statistics for Bidirectional Path Tracing 
#### Developed by Hirad Sab
#### Data & Documentation by Timbwaoga Aime Judicael Ouermi 
#### Initial Concept by Laura Lediaev 

### Introduction 
This application is a web base tool that allows the users to explore the different hierarchies of data that combine to form an image (render) using Path Tracing techniques. The user can further identify problematic sample, path lengths, or objects and remove them or alter them to fit their need by sending representative of problematic data to the server which in turn will process the statistical data and return a new render. Furthermore the user is able to detect and fix problematic pixels with a high-level approach using automatic "firefly" detection and removal tools. 

![](http://kbladin.se/dmt_projects/img/monte_carlo/bunny_glass2.png) 

### Tools 
The following tools and technologies have been used extensively throughout this project: 
* [D3.js](https://d3js.org/) 
	* D3 is used to construct and manipulate the different windows, and dynamically display relevant information.
* [jQuery](https://jquery.com/) 
	* jQuery is used extensively for easy access of and manipulation of DOM elements and UI elements.
* [HTML5 Canvas Element](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) 
	* Canvas elements are used throughout the project for modification and accessing pixel data using selectors or through algorithmic procedures.
* [Cropper.js](https://github.com/fengyuanchen/cropper) 
	* Cropper.js is provides easy to use API for cropping and manipulating images.
* [Bootstrap](http://getbootstrap.com/) 
	* Bootstrap is utilized to provide a responsive and uniform display.
	
### Code
Besides the visual elements, there has been a lot of algorithmic developments and data management in this project.
  
* Automatic detection.
	 * We calculate the relation of pixels to their neighbors to detect if a pixel is a possible outlier. 

* Pixel Cleansing
	 * Our visualization is capable of automatic detection and elimination of outlier pixels.

### Features
This visualization project provides a wide range of image and data inspection. Furthermore our approach in data allows other developers who work on open-source rendering engines to be able to easily integrate out front-end with their backend and provide a solution to other enthusiasts. 

Each tool has self-explanatory description, and to reduce confusion every element is document as much as possible to guide the user through the data, and process.

### URLS
* [Screen Cast URL] (https://youtu.be/W8CU533tsbs)
* [Website URL] (https://wbppisbpt.github.io/)

### Background and Motivation 
Bidirectional path tracing is a physically-based rendering technique. In many cases it is capable of producing a rendered image that is practically indistinguishable from a photograph. The rendering program attempts to simulate the physical properties of all elements of a scene, including lights, geometric objects, materials, and cameras. Path tracing is a Monte-Carlo integration technique that generates paths using probability distributions. Regular (unidirectional) path tracing starts by choosing a random position on the film plane and then randomly choosing a position on the camera aperture. These two choices will create a ray that shoots from the camera into the scene. Every time the ray intersects a surface, the material properties of the surface are used to choose a new direction to travel in. The ray continues to bounce around the scene until one of three conditions is met. The ray may hit a light creating a complete path, at which point the ray’s path is terminated. Alternatively, the ray may have bounced so many times that we choose to terminate it. Lastly, the scene might be open and the ray may have gone off into outer space (a non-hit). Every surface interaction, including the camera, is called a vertex. A complete path starts at the camera and ends at a light, and every vertex contains information needed to calculate the final color contribution for that path. ![](https://graphics.stanford.edu/~henrik/images/imgs/cbox_pathtracing.jpg) 

### Project Objectives 
The main purpose of this visualization project is to provide an overview of the rendering process and make it easy to explore how the image was created and possibly identify problematic pixel samples. This allows the artist/developer to understand and determine the components of the scene that result in low-probability paths that can lead to noise in the final image. Such low-probability paths can result in outlier pixels, informally referred to as fireflies, that do not fit in terms of color with their neighboring pixels due to intense brightness. Through visualizing path statistics and probabilities, one could easily trace the source of the error and proceed with modifying the image to eliminate the outlier pixel samples, or conversely changing the scene to make rendering easier. There is one question that is very important to answer, which samples cause a pixel to be a great deal brighter than it should be. These **outlier pixels or “fireflies”** are a common nuisance in rendering, and can come from many difference sources. These bad samples are not incorrect, strictly speaking, but would require a very high number of samples in order to average to the expected (correct) color value. That is because these are usually very low probability samples. We possibly need an unreasonably large number of samples to get a substantial set of these rare samples. In order to produce a nice image in a reasonable amount of time, it is often more pragmatic to simply remove these samples from the image. ![](https://4.bp.blogspot.com/-dOR9w1pz7OU/VvjAk-l4OgI/AAAAAAAAA-k/bXjuYDtFYAIEaWuPLLy_taIPrai5i6vMw/s1600/25v36.png) 

### Data
The actual data is generated as a matter of course during the rendering process. Normally this data is generated iteratively, processed to get a final color value, and then discarded in order to minimize memory usage. <strike>Since there will be a large amount of data, I have decided to store everything in a database. The database may need to be optimized for queries, since fetching data may cause a bottleneck.</strike> Our rendering program is [smallpt](http://www.kevinbeason.com/smallpt/), written in C++ by Kevin Beason. It features Global illumination via unbiased Monte Carlo path tracing and Specular, Diffuse, and Glass BRDFs. The data was stored as a series of JSON files for each pixel and samples. Unfortunately the person responsible for database was not able to deliver at all. Thus we opted for collecting a large number of JSON files from smallpt. However due to Github restrictions on number of files we have reached a limit. ![](https://i.imgur.com/lqspf3w.png) 

### Data Representation
Data is broken up into a hierarchy of four levels. At the root we the actual image which contains a series of pixels, each containing four values for Red, Blue, Green, and Alpha channels. This information is simply inferred from the received image. Next, for each pixel, there exists a collection of sample that contribute to the final color value of the pixel. We use the following scheme for representing sample collections.

<pre>                        
{"samples": [
	{"uid": "S-X-Y-0", "final_contribution": 0.00000, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
	{"uid": "S-X-Y-1", "final_contribution": 0.00000, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
	{"uid": "S-X-Y-2", "final_contribution": 0.00000, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
	{"uid": "S-X-Y-3", "final_contribution": 0.00000, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
	{"uid": "S-X-Y-4", "final_contribution": 0.00000, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
	{"uid": "S-X-Y-5", "final_contribution": 0.00000, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
	{"uid": "S-X-Y-6", "final_contribution": 0.00000, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
]}
</pre>

The <kbd>S-X-Y-N</kbd> ID of each sample represents the pixel it belongs to using the <kbd>X</kbd> and <kbd>Y</kbd> values which respectively correspond to the row and column of the pixel in the image. The last integer <kbd>N</kbd> is the unique index of the sample for that pixel. <kbd>S</kbd> is simply a prefix that identifies this object as a <kbd>Sample</kbd>. Each sample consists of a unique ID which was explained above, as well as a <kbd>final_contribution</kbd> value which signifies the importance of the sample in the context of the parent pixel, as well as <kbd>RGB</kbd> values. A sample is in turn a product of a number of paths. And yet each path itself is formed from a ray bouncing from different objects. We represents the paths and vertices collections as follows.

<pre>                        
{"paths": [
	{"uid": "P-X-Y-S-0", "weight": 0.25, "red": 0, "green": 0, "blue": 0,
		"veredtices": [
			{"oblueject_id": 3, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 5, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 3, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 5, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 4, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 0, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 4, "red": 0.00000, "green": 0.00000, "blue": 0.00000}
		]
	},
	{"uid": "P-X-Y-S-1", "weight": 0.25, "red": 0, "green": 0, "blue": 0,
		"veredtices": [
			{"oblueject_id": 3, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 0, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 3, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 0, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 4, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 5, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 4, "red": 0.00000, "green": 0.00000, "blue": 0.00000},
			{"oblueject_id": 5, "red": 0.00000, "green": 0.00000, "blue": 0.00000}
		]
	}
]} 
</pre>

Similarly <kbd>P-X-Y-S-N</kbd> ID of each path represents its unique index <kbd>N</kbd> in the sample <kbd>S</kbd> that it belongs to, as well as the pixel the sample belongs to using the <kbd>X</kbd> and <kbd>Y</kbd> values which respectively correspond to the row and column of the pixel in the image. <kbd>P</kbd> is simply a prefix that identifies this object as a <kbd>Path</kbd>. As displayed, a path in our representation consists a number of vertices, each having their own value of <kbd>RGB</kbd>. The path itself also is represented using <kbd>RGB</kbd> and in this case a uniform <kbd>weight</kbd>.
