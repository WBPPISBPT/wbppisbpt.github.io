/**
 * ConstructoroutlyingYear Chart
 *
 * @param samplesChart instance of SamplesChart
 * @param pathsChart instance of Vote PathsChart
 * @param renders data corresponding to render thumbnail gallery
 */
function ImageAnalyzer(samplesChart, pathsChart, renders) {
    var self = this;

    self.samplesChart = samplesChart;
    self.pathsChart = pathsChart;
    self.renders = renders;
    self.init();
}


ImageAnalyzer.prototype.init = function () {

    var self = this;
    self.selectedRender;

    self.outlierPixels = [];
    self.ratioThreshold = 2;
    self.previousSelection = -1;


    self.sliderInstantiated = false;
    self.sliderOnChange = false;

    self.cropperCanvas;

};

/**
 * Finds the corresponding URI of the passed render object.
 * If the thumbnail URI doesn't exist, it will return the orignal
 * size URI. If that doesnt exists either returns a placehold.it image.
 * @param d     Render object
 * @param type  'thumb' for thumbnail URI, null for original size
 * @returns {*} URI of thumb, source, or a generic placeholder
 */
ImageAnalyzer.prototype.getURI = function (d, type) {
    if (type == 'thumb') {
        if (d.thumbnailURI == '' || d.thumbnailURI == null) {
            if (d.sourceURI == '' || d.sourceURI == null) {
                var placeholder = 'https://placehold.it/' + d.width + 'x' + d.height + '&text=' + d.uid;
                return placeholder;
            }
            return d.sourceURI;
        }
        else {
            return d.thumbnailURI;
        }
    }
    else {
        if (d.sourceURI == '' || d.sourceURI == null) {
            var placeholder = 'https://placehold.it/' + d.width + 'x' + d.height + '&text=' + d.uid;
            return placeholder;
        }
        else {
            return d.sourceURI;
        }
    }
};


/**
 * Initializes the render thumbnail gallery, selected render, reconstructed
 * render.
 */
ImageAnalyzer.prototype.update = function () {
    var self = this;
    self.selectedRender = $('#render-image');

    var renderWidth = self.selectedRender[0].naturalWidth;
    var renderHeight = self.selectedRender[0].naturalHeight;
    console.log(self.selectedRender[0].naturalHeight);
    $('#reconst-image').attr('src', 'http://placehold.it/' + renderWidth / 3 + 'x' + renderHeight / 3 + '&text=Reconstruction+Not+Executed');

    var galleryContainer = d3.select('.render-gallery')
    var galleryItem = galleryContainer.selectAll('li')
        .data(self.renders['renders']);

    galleryItem.exit().remove();

    var thumbs_li_enter = galleryItem.enter()
        .append('li');

    galleryItem = galleryItem.merge(thumbs_li_enter);
    galleryItem.classed('col-md-1', true)
        .append('a')
        .classed('thumbnail', true)
        .style('height', function () {
            return d3.select(this).node().getBoundingClientRect().width + 'px';
        })
        .style('background-image', function (d) {
            return 'url(' + self.getURI(d, 'thumb') + ')';
        })
        .attr('id', function (d) {
            return 'thumb-' + d.uid;
        })
        .on("click", function (d) {
            if (!isFrozen) {
                $('#reconst-image').attr('src', 'http://placehold.it/' + d.width / 3 + 'x' + d.height / 3 + '&text=Reconstruction+Not+Executed');
                self.selectedRender.cropper("setDragMode", "crop");
                self.selectedRender.cropper("replace", self.getURI(d, null));
            }
        });

    self.cropper();
};

/**
 * Initialized the cropper on a jquery selection.
 * @param selectedRender Jquery selection.
 */
ImageAnalyzer.prototype.cropper = function () {
    var self = this;
    var $dataX = $('#dataX');
    var $dataY = $('#dataY');
    var $dataHeight = $('#dataHeight');
    var $dataWidth = $('#dataWidth');
    var options = {
        // preview: '.img-preview',
        dragMode: 'crop',
        viewMode: 3,
        modal: false,
        autoCropArea: 0.2,
        crop: function (e) {
            $dataX.text(Math.round(e.x) + 'px');
            $dataY.text(Math.round(e.y) + 'px');
            $dataHeight.text(Math.round(e.height) + 'px');
            $dataWidth.text(Math.round(e.width) + 'px');
        }
    };

    // Initialize
    self.selectedRender.on({
        'build.cropper': function (e) {
            // console.log(e.type);
        },
        'built.cropper': function (e) {
            // console.log(e.type);
        },
        'cropstart.cropper': function (e) {
            // console.log(e.type, e.action);
        },
        'cropmove.cropper': function (e) {
            // console.log(e.type, e.action);
        },
        'cropend.cropper': function (e) {
            // console.log(e.type, e.action);
            self.selectedRender.cropper("setDragMode", "move");
        },
        'crop.cropper': function (e) {
            // console.log(e.type, e.x, e.y, e.width, e.height, e.rotate, e.scaleX, e.scaleY);
            self.updateBrushView()
            if (self.cropperCanvas != undefined) {
                $('#download').attr('href', self.cropperCanvas.toDataURL('image/jpeg'));
            };
        },
        'zoom.cropper': function (e) {
            // console.log(e.type, e.ratio);
            self.updateBrushView()
        }
    }).cropper(options);

    self.freeze();
};

ImageAnalyzer.prototype.updateBrushView = function () {
    var self = this;
    self.cropperCanvas = self.selectedRender.cropper('getCroppedCanvas');
    var canvasFirstPixel = self.cropperCanvas.getContext('2d').getImageData(0, 0, 1, 1);
    var cropperCanvasContainer = $('.cropper-canvas-container');
    var indicatorOuter = $('#indicator-outer');

    indicatorOuter.contextmenu(function () {
        return false;
    });

    // If Canvas is not transparent
    if (!canvasFirstPixel.data[3] == 0) {
        $(self.cropperCanvas).attr('id', 'cropper-canvas');
        cropperCanvasContainer.html(self.cropperCanvas);

        // Set the size of the indicator SVG container
        indicatorOuter.css('height', $(self.cropperCanvas).height());

        // Set the size of the indicator SVG
        $('#indicator-svg').attr('width', $(self.cropperCanvas).width());
        $('#indicator-svg').attr('height', $(self.cropperCanvas).height());

        // Instantiate the accuracy slider
        if (!self.sliderInstantiated) {
            $('#slider-threshold').on("change", function () {
                self.ratioThreshold = $(this).val();
                if (isFrozen) {
                    self.outlierPixels = [];
                    self.autoDetectFireflies();
                }
            });
            self.sliderInstantiated = true;
        }

        // Update HTML elements.
        $('#no-region-alert').hide();
        $('#analyzer-section').show();

        $('#region-alert').addClass('alert-info').removeClass('alert-danger');
        var selectorAlertText = '<strong>Click</strong> to select; <strong>right click</strong> to delete.';
        $('#region-alert').html(selectorAlertText);
    }
    else {
        // Remove the canvas since no region exists.
        cropperCanvasContainer.html('');

        // Update HTML elements.
        $('#no-region-alert').show();
        $('#analyzer-section').hide();

        $('#region-alert').addClass('alert-danger').removeClass('alert-info');
        var selectorAlertText = 'Selection will appear only after interaction with the <strong>cropbox</strong> above.';
        $('#region-alert').html(selectorAlertText);
    }
};

ImageAnalyzer.prototype.freeze = function () {
    var self = this;

    var finalizeButton = $('#finalize-selection');
    finalizeButton.click(function () {
        if (!isFrozen) {
            isFrozen = true;

            // Freeze cropper
            self.selectedRender.cropper('disable');

            $('#slider-outer').show();

            // Update UI
            finalizeButton.text('Unfreeze Selection');
            finalizeButton.addClass('btn-danger').removeClass('btn-success');
            $('#finalize-freeze-alert').hide();

            self.autoDetectFireflies();
            // Binds an event listener to #selector-container
            self.manualDetectFireflies();
        }
        else if (isFrozen)
            Confirm.show('Are you sure?', 'All of your selections will be lost', {
                'Unfreeze': {
                    'primary': true,
                    'callback': function () {

                        // Unfreeze cropper
                        self.selectedRender.cropper('enable');

                        $('#slider-outer').hide();

                        // Update UI
                        finalizeButton.text('Freeze Selection');
                        finalizeButton.addClass('btn-success').removeClass('btn-danger');
                        $('#finalize-freeze-alert').show();

                        // Unbinds an event listener from #selector-container
                        $('#indicator-outer').off("click");

                        // Remove all previously selected pixels
                        self.outlierPixels = [];
                        self.drawFireflyIndicators();
                        isFrozen = false;
                        Confirm.hide();
                    }
                }
            });
        // If else end
    });
};

ImageAnalyzer.prototype.autoDetectFireflies = function () {
    var self = this;
    var canvasW = self.cropperCanvas.getAttribute('width');
    var canvasH = self.cropperCanvas.getAttribute('height');

    var pixelData = self.cropperCanvas.getContext('2d').getImageData(0, 0, canvasW, canvasH);
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
                pixelData[i] / redAverage >= self.ratioThreshold &&
                pixelData[i + 1] / greenAverage >= self.ratioThreshold &&
                pixelData[i + 2] / blueAverage >= self.ratioThreshold;
            if (firefly) {
                var mainIndex = i / 4;
                var event = {};
                event.x = mainIndex % canvasW;
                event.y = Math.floor(mainIndex / canvasW);
                self.getFirefly(event, self);
            }
        }

    }
    self.drawFireflyIndicators();

    var pixelCountText = '<strong>' + self.outlierPixels.length + '</strong> outlier pixels were automatically detected. Adjust the preciseness below.';
    $('#auto-pixel-count').html(pixelCountText);
};

ImageAnalyzer.prototype.manualDetectFireflies = function () {
    var self = this;

    $('#indicator-outer').click(function (event) {
        self.getFirefly(event, self);
    });
};

ImageAnalyzer.prototype.getFirefly = function (event, self) {
    var cropData = self.selectedRender.cropper('getData');
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

    var ratio = $(self.cropperCanvas).width() / cdW;

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

    var pixelRGBA = self.cropperCanvas.getContext('2d').getImageData(x - cdX, y - cdY, 1, 1);

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

    var index = self.outlierPixels.findIndex(function (element) {
        return element.key == currentPixel.key;
    });
    if (index >= 0) {
        self.outlierPixels[index].selected = true;
    }
    else {
        self.outlierPixels.push(currentPixel);
    }

    if (event.target) {
        self.drawFireflyIndicators();
    }
};

ImageAnalyzer.prototype.drawFireflyIndicators = function () {
    var self = this;

    console.log("In Draw");
    var selectorSVG = d3.select('#indicator-svg');
    var circles = selectorSVG.selectAll("circle")
        .data(self.outlierPixels);

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
            return Math.sqrt(d.ratio * d.ratio * 2) / 2;
        })
        .on('click', function (d, i) {
            if (self.previousSelection != -1 && self.outlierPixels[self.previousSelection] != undefined) {
                self.outlierPixels[self.previousSelection].selected = false;
                d3.select('.selector-current').classed('selector-current', false);
            }
            self.previousSelection = i;
            d3.select(this).classed('selector-current', true);
        })
        .on('contextmenu', function (d, i) {
            self.outlierPixels.splice(i, 1);
            d3.select(this).remove();
            return false;
        });

};
