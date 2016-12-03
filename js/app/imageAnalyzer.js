var galleryUIDKey = "uid";
var galleryThumbURIKey = "thumbnailURI";
var gallerySourceURIKey = "sourceURI";
var galleryWidthKey = "width";
var galleryHeightKey = "height";
var gallerySamplesCountKey = "samples";


/**
 * Constructor for ImageAnalyzer
 *
 * @param samplesChart instance of SamplesChart
 * @param pathsChart instance of Vote PathsChart
 * @param renders data corresponding to render thumbnail gallery
 */
function ImageAnalyzer(samplesChart, pathsChart, renders) {
    var s = this;

    s.samplesChart = samplesChart;
    s.pathsChart = pathsChart;
    s.renders = renders;

    // s.MT = new Multithread(2);
    s.init();
}


ImageAnalyzer.prototype.init = function () {
    var s = this;
    s.selectedRender;
    s.cropperCanvas;
    s.oldCropBoxData;

    s.outlierPixels = [];
    s.ratioThreshold = 2;
    s.selectionThreshold = 80;
    s.previousSelection = -1;

    s.canFreeze = false;


    s.sliderInstantiated = false;
    s.sliderOnChange = false;

    s.croppedCanvas;

    if (demo) {
        var pixel = {
            colorA: 255,
            colorB: 255,
            colorG: 255,
            colorR: 252,
            key: "504-391",
            offsetX: 228.3227848101266,
            offsetY: 221.29746835443038,
            ratio: 7.025316455696203,
            selected: true,
            x: 504,
            y: 391
        }

        this.updateSamplesChart(pixel);

    }
};

/**
 * Finds the corresponding URI of the passed gallery object.
 * If the thumbnail URI doesn't exist, it will return the original
 * size URI. If that doesn't exists either returns a placehold.it image.
 * @param d     Render object
 * @param type  'thumb' for thumbnail URI, null for original size
 * @returns {*} URI of thumb, source, or a generic placeholder
 */
ImageAnalyzer.prototype.getURI = function (d, type) {
    if (type == 'thumb') {
        if (d[galleryThumbURIKey] == '' || d[galleryThumbURIKey] == null) {
            if (d[gallerySourceURIKey] == '' || d[gallerySourceURIKey] == null) {
                var placeholder = 'https://unsplash.it/' + d[galleryWidthKey] + '/' + d[galleryHeightKey] + '&text=' + d[galleryUIDKey];
                return placeholder;
            }
            return d[gallerySourceURIKey];
        }
        else {
            return d[galleryThumbURIKey];
        }
    }
    else {
        if (d[gallerySourceURIKey] == '' || d[gallerySourceURIKey] == null) {
            var placeholder = 'https://unsplash.it/' + d[galleryWidthKey] + '/' + d[galleryHeightKey] + '&text=' + d[galleryUIDKey];
            return placeholder;
        }
        else {
            return d[gallerySourceURIKey];
        }
    }
};


/**
 * Initializes the render thumbnail gallery, selected render, reconstructed
 * render.
 */
ImageAnalyzer.prototype.update = function () {
    var s = this;
    s.selectedRender = $('#render-image');

    var renderWidth = s.selectedRender[0].naturalWidth;
    var renderHeight = s.selectedRender[0].naturalHeight;
    $('#reconst-image').attr('src', 'https://placehold.it/' + renderWidth / 3 + 'x' + renderHeight / 3 + '&text=Reconstruction+Not+Executed');

    var galleryContainer = d3.select('.render-gallery')
    var galleryItem = galleryContainer.selectAll('li')
        .data(s.renders['renders']);

    galleryItem.exit().remove();

    var galleryItemEnter = galleryItem.enter()
        .append('li');

    galleryItem = galleryItem.merge(galleryItemEnter);
    galleryItem.classed('col-md-1', true)
        .append('a')
        .classed('thumbnail', true)
        .style('height', function () {
            return d3.select(this).node().getBoundingClientRect().width + 'px';
        })
        .style('background-image', function (d) {
            return 'url(' + s.getURI(d, 'thumb') + ')';
        })
        .attr('id', function (d) {
            return 'thumb-' + d[galleryUIDKey];
        })
        .on("click", function (d) {
            if (!isFrozen) {
                $('#reconst-image').attr('src', 'https://placehold.it/' + d[galleryWidthKey] / 3 + 'x' + +d[galleryHeightKey] / 3 + '&text=Reconstruction+Not+Executed');
                s.selectedRender.cropper("setDragMode", "crop");
                s.selectedRender.cropper("replace", s.getURI(d, null));
                removedSamples = {};
            }
        });


    $('#input-threshold').val(s.ratioThreshold);
    $('#slider-threshold').val(s.ratioThreshold);

    s.cropper();
};

/**
 * Initialized the cropper on a jquery selection.
 * @param selectedRender Jquery selection.
 */
ImageAnalyzer.prototype.cropper = function () {
    var s = this;
    var dataX = $('#cropX');
    var dataY = $('#cropY');
    var dataHeight = $('#cropHeight');
    var dataWidth = $('#cropWidth');
    var options = {
        // preview: '.img-preview',
        dragMode: 'crop',
        viewMode: 3,
        modal: false,
        crop: function (e) {
            dataX.text(Math.round(e.x) + 'px');
            dataY.text(Math.round(e.y) + 'px');
            dataHeight.text(Math.min(Math.round(e.height), s.selectionThreshold) + 'px');
            dataWidth.text(Math.min(Math.round(e.width), s.selectionThreshold) + 'px');
        }
    };

    // Initialize
    s.selectedRender.on({
        'build.cropper': function (e) {
            // e.type
        },
        'built.cropper': function (e) {
            // e.type
            s.cropperCanvas = $('.cropper-canvas');
            s.cropBoxSize('get');
            s.cropBoxSize('init');
        },
        'cropstart.cropper': function (e) {
            // e.type, e.action
            s.cropBoxSize('get');
        },
        'cropmove.cropper': function (e) {
            // e.type, e.action
        },
        'cropend.cropper': function (e) {
            // e.type, e.action
            s.selectedRender.cropper("setDragMode", "move");
            s.cropBoxSize('get');
        },
        'crop.cropper': function (e) {
            // e.type, e.x, e.y, e.width, e.height, e.rotate, e.scaleX, e.scaleY

            s.cropBoxSize('set', e);

            s.updateBrushView();

            if (s.croppedCanvas != undefined)
                $('#download').attr('href', s.croppedCanvas.toDataURL('image/jpeg'));
        },
        'zoom.cropper': function (e) {
            s.cropBoxSize('get');
            s.updateBrushView();
        }
    }).cropper(options);

    s.freeze();
};

ImageAnalyzer.prototype.cropBoxSize = function (param, event) {
    var s = this;
    s.modifyCropBox = false;

    if (param == 'get')
        s.oldCropBoxData = s.selectedRender.cropper("getCropBoxData");
    else {
        var realTimeCropBoxData = s.selectedRender.cropper("getCropBoxData");
        var width = (s.cropperCanvas.width() * s.selectionThreshold) / s.selectedRender[0].naturalWidth;
        var height = (s.cropperCanvas.height() * s.selectionThreshold) / s.selectedRender[0].naturalHeight;

        switch (param) {
            case 'init' :
                realTimeCropBoxData.width = width;
                realTimeCropBoxData.height = height;
                realTimeCropBoxData.left = (s.cropperCanvas.width() - width) / 2;
                realTimeCropBoxData.top = (s.cropperCanvas.height() - height) / 2;
                s.modifyCropBox = true;
                break;
            case 'set' :
                if (event.width >= s.selectionThreshold + 0.5) {
                    var leftDecreasing = realTimeCropBoxData.left < s.oldCropBoxData.left;
                    var widthIncreasing = s.oldCropBoxData.width < realTimeCropBoxData.width;

                    if (leftDecreasing && widthIncreasing) {
                        realTimeCropBoxData.left = s.oldCropBoxData.left;
                        s.modifyCropBox = true;
                        break;
                    }
                    realTimeCropBoxData.width = width;
                    s.modifyCropBox = true;
                    break;
                }
                else if (event.width < s.selectionThreshold + 0.5) {
                    if (s.oldCropBoxData.left > realTimeCropBoxData.left) {
                        s.oldCropBoxData.left = realTimeCropBoxData.left;
                        s.modifyCropBox = false;
                        break;
                    }
                }
                if (event.height >= s.selectionThreshold + 0.5) {
                    if (s.oldCropBoxData.top > realTimeCropBoxData.top && s.oldCropBoxData.height < realTimeCropBoxData.height) {
                        realTimeCropBoxData.top = s.oldCropBoxData.top;
                        s.modifyCropBox = true;
                        break;
                    }
                    realTimeCropBoxData.height = height;
                    s.modifyCropBox = true;
                    break;
                }
                else if (event.height < s.selectionThreshold + 0.5) {
                    if (s.oldCropBoxData.top > realTimeCropBoxData.top) {
                        s.oldCropBoxData.top = realTimeCropBoxData.top;
                        s.modifyCropBox = false;
                        break;
                    }
                }
        }

        if (s.modifyCropBox)
            s.selectedRender.cropper("setCropBoxData", realTimeCropBoxData);
    }
};

ImageAnalyzer.prototype.updateBrushView = function () {
    var s = this;
    s.croppedCanvas = s.selectedRender.cropper('getCroppedCanvas');
    var canvasFirstPixel = s.croppedCanvas.getContext('2d').getImageData(0, 0, 1, 1);
    var cropperCanvasContainer = $('.cropper-canvas-container');
    var indicatorOuter = $('#indicator-outer');

    indicatorOuter.contextmenu(function () {
        return false;
    });

    var selectorAlertText;
    // If Canvas is not transparent
    if (canvasFirstPixel.data[3] != 0) {
        $(s.croppedCanvas).attr('id', 'cropper-canvas');
        cropperCanvasContainer.html(s.croppedCanvas);

        // Set the size of the indicator SVG container
        indicatorOuter.css('height', $(s.croppedCanvas).height());

        // Set the size of the indicator SVG
        $('#indicator-svg').attr('width', $(s.croppedCanvas).width());
        $('#indicator-svg').attr('height', $(s.croppedCanvas).height());


        var setPrecision = function (from, to) {
            $(to).val($(from).val());
            s.ratioThreshold = $(from).val();
            if (isFrozen) {
                s.outlierPixels = [];
                s.autoDetectFireflies();
            }
        };

        // Instantiate the accuracy slider
        if (!s.sliderInstantiated) {
            $('#slider-threshold').on("change", function () {
                setPrecision('#slider-threshold', '#input-threshold');
            });

            $('#input-threshold').on("change", function () {
                if ($(this).val() > 10)
                    $(this).val(10);
                if ($(this).val() < 1)
                    $(this).val(1);

                setPrecision('#input-threshold', '#slider-threshold');
            });

            $('#set-threshold').on("click", function () {
                var input = $('#input-threshold');
                if (input.val() > 10)
                    input.val(10);
                if (input.val() < 1)
                    input.val(1);

                setPrecision('#input-threshold', '#slider-threshold');
            });
            s.sliderInstantiated = true;
        }

        // Update HTML elements.
        $('#analyzer-region').fadeIn( 350, 'linear' );

        $('#region-alert').addClass('alert-success').removeClass('alert-danger');
        selectorAlertText = "<p> </p>The cropbox is limited to <strong>" + s.selectionThreshold + "x" + s.selectionThreshold + "</strong> pixels which should be sufficient for most analyses. When you are satisfied with your selection, you can proceed with detection.";
        $('#region-alert').html(selectorAlertText);
    }
    else {
        // Remove the canvas since no region exists.
        cropperCanvasContainer.html('');

        // // Update HTML elements.
        $('#analyzer-region').fadeOut( 350, 'linear' );

        $('#region-alert').addClass('alert-danger').removeClass('alert-success');

        selectorAlertText = "<p> </p>The <strong>first step</strong> of analysis is to select a region from the image using the <strong>cropbox</strong> above.";

        $('#region-alert').html(selectorAlertText);
    }
};

ImageAnalyzer.prototype.freeze = function () {
    var s = this;

    var finalizeButton = $('#finalize-selection');
    finalizeButton.click(function () {
        if (!isFrozen) {
            isFrozen = true;

            // Freeze cropper
            s.selectedRender.cropper('disable');

            $('#slider-outer').fadeIn( 350, 'linear' );

            // Update UI
            finalizeButton.text('Discard Detection');
            finalizeButton.addClass('btn-danger').removeClass('btn-success');

            $('#render-region').addClass('is-frozen');
            $('#gallery-region').addClass('is-frozen');
            $( ".thumbnail" ).each(function( index ) {
                $( this ).addClass('is-frozen');
            });
            $('#is-frozen-message').fadeIn( 350, 'linear',  function() {
                $('html, body').animate({
                    scrollTop: $("#analyzer-region").offset().top
                }, 200);
            });


            s.autoDetectFireflies();

            // Binds an event listener to #selector-container
            s.manualDetectFireflies();
        }
        else if (isFrozen)
            Confirm.show('Discard Detection', 'All of your manual changes will be discarded. <br>Are you sure you want to proceed?', {
                'Discard': {
                    'primary': true,
                    'callback': function () {

                        // Unfreeze cropper
                        s.selectedRender.cropper('enable');

                        $('#slider-outer').fadeOut( 350, 'linear' );

                        // Update UI
                        finalizeButton.text('Begin Detection');
                        finalizeButton.addClass('btn-success').removeClass('btn-danger');

                        $('#render-region').removeClass('is-frozen');
                        $('#gallery-region').removeClass('is-frozen');
                        $( ".thumbnail" ).each(function( index ) {
                            $( this ).removeClass('is-frozen');
                        });
                        
                        $('#is-frozen-message').fadeOut( 350, 'linear',  function() {
                            $('html, body').animate({
                                scrollTop: $("#render-region").offset().top
                            }, 200);
                        });


                        // Unbinds an event listener from #selector-container
                        $('#indicator-outer').off("click");

                        // Remove all previously selected pixels
                        s.outlierPixels = [];
                        s.drawFireflyIndicators();
                        isFrozen = false;
                        Confirm.hide();
                    }
                }
            });
        // If else end
    });
};

ImageAnalyzer.prototype.autoDetectFireflies = function (s) {

    if (s == undefined || s == null)
        s = this;
    var canvasW = s.croppedCanvas.getAttribute('width');
    var canvasH = s.croppedCanvas.getAttribute('height');

    var pixelData = s.croppedCanvas.getContext('2d').getImageData(0, 0, canvasW, canvasH);
    pixelData = pixelData.data;

    var row = canvasW * 4;
    for (var i = 0; i < pixelData.length; i += 4) {
        var isLeft = i % row == 0;
        var isRight = (i + 3) % row == 11;
        var isTop = (i - row) <= 0;
        var isBottom = i + row >= pixelData.length;
        if (!isLeft && !isRight && !isTop && !isBottom) {
            var r = i, g = i + 1, b = i + 2;
            var redAverage =
                pixelData[r - row - 4] + pixelData[r - row] + pixelData[r - row + 4] +
                pixelData[r - 4] + pixelData[r + 4] +
                pixelData[r + row - 4] + pixelData[r + row] + pixelData[r + row + 4];
            var greenAverage =
                pixelData[g - row - 4] + pixelData[g - row] + pixelData[g - row + 4] +
                pixelData[g - 4] + pixelData[g + 4] +
                pixelData[g + row - 4] + pixelData[g + row] + pixelData[g + row + 4];
            var blueAverage =
                pixelData[b - row - 4] + pixelData[b - row] + pixelData[b - row + 4] +
                pixelData[b - 4] + pixelData[b + 4] +
                pixelData[b + row - 4] + pixelData[b + row] + pixelData[b + row + 4];

            redAverage /= 8;
            greenAverage /= 8;
            blueAverage /= 8;

            var firefly =
                pixelData[i] / redAverage >= s.ratioThreshold &&
                pixelData[i + 1] / greenAverage >= s.ratioThreshold &&
                pixelData[i + 2] / blueAverage >= s.ratioThreshold;
            if (firefly) {
                var mainIndex = i / 4;
                var event = {};
                event.x = mainIndex % canvasW;
                event.y = Math.floor(mainIndex / canvasW);
                s.getFirefly(event, s);
            }
        }

    }

    var pixelCountText = "<strong>" + s.outlierPixels.length + "</strong> outlier pixels were automatically detected.";
    $('#finalize-freeze-alert').html(pixelCountText);

    s.drawFireflyIndicators();
};

ImageAnalyzer.prototype.manualDetectFireflies = function () {
    var s = this;

    $('#indicator-outer').click(function (event) {
        s.getFirefly(event, s);
    });
};

ImageAnalyzer.prototype.getFirefly = function (event, s) {
    var cropData = s.selectedRender.cropper('getData');
    var cropCanvas = d3.select("#cropper-canvas");
    var cropCanvasBounds = cropCanvas.node().getBoundingClientRect();

    var cdX = Math.floor(cropData.x);
    var cdY = Math.floor(cropData.y);
    var cdW = Math.floor(cropData.width);
    var cdH = Math.floor(cropData.height);

    var xScale = d3.scaleLinear()
        .range([cdX, cdX + cdW])
        .domain([0, cropCanvasBounds.width]);

    var yScale = d3.scaleLinear()
        .range([cdY, cdY + cdH])
        .domain([0, cropCanvasBounds.height]);

    var ratio = $(s.croppedCanvas).width() / cdW;

    if (event.target) {
        var x = event.offsetX;
        x = xScale(x);
        x = Math.floor(x);

        var y = event.offsetY;
        y = yScale(y);
        y = Math.floor(y);
    }
    else {
        x = cdX + event.x;
        y = cdY + event.y;
    }

    var pixelRGBA = s.croppedCanvas.getContext('2d').getImageData(x - cdX, y - cdY, 1, 1);

    var currentPixel = {};
    currentPixel.key = x + '-' + y;
    currentPixel.ratio = ratio;
    currentPixel.offsetX = (x - cdX) * ratio + ratio / 2;
    currentPixel.x = x;
    currentPixel.offsetY = (y - cdY) * ratio + ratio / 2;
    currentPixel.y = y;
    currentPixel.colorR = pixelRGBA.data[0];
    currentPixel.colorG = pixelRGBA.data[1];
    currentPixel.colorB = pixelRGBA.data[2];
    currentPixel.colorA = pixelRGBA.data[3];
    currentPixel.selected = false;

    var index = s.outlierPixels.findIndex(function (element) {
        return element.key == currentPixel.key;
    });
    if (index >= 0) {
        s.outlierPixels[index].selected = true;
    }
    else {
        s.outlierPixels.push(currentPixel);
    }

    if (event.target) {
        s.drawFireflyIndicators();
    }
};

ImageAnalyzer.prototype.drawFireflyIndicators = function (s) {
    if (s == undefined || s == null)
        s = this;

    var selectorSVG = d3.select('#indicator-svg');
    var circles = selectorSVG.selectAll("circle")
        .data(s.outlierPixels);

    circles.exit().remove();

    var circlesEnter = circles.enter()
        .append("circle")
        .classed("selector-circle", true);

    circles = circles.merge(circlesEnter);

    circles
        .attr('cx', function (d) {
            return d.offsetX;
        })
        .attr('cy', function (d) {
            return d.offsetY;
        })
        .attr('r', function (d) {
            return d.ratio / 2;
        })
        .on('click', function (d, i) {
            if (s.previousSelection != -1 && s.outlierPixels[s.previousSelection] != undefined) {
                s.outlierPixels[s.previousSelection].selected = false;
                d3.select('.selector-current').classed('selector-current', false);
            }
            s.previousSelection = i;
            d3.select(this).classed('selector-current', true);
            s.updateSamplesChart(d);
            $('html, body').animate({
                scrollTop: $("#samples-region").offset().top
            }, 200);
        })
        .on('contextmenu', function (d, i) {
            s.outlierPixels.splice(i, 1);
            d3.select(this).remove();
            // return false;
        });
};

ImageAnalyzer.prototype.updateSamplesChart = function (pixel) {
    var s = this;
    console.log('User selected pixel: ', pixel.x, pixel.y);
    console.log('Sending pixel identity to samplesChart');
    s.samplesChart.getData(pixel);
};
