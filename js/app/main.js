
//var database_URI = "http://localhost:8000";
var database_URI = "http://cs6630.sci.utah.edu:8000";


var demo = false;
var isFrozen = false;
var removedSamples = {};


/*
 * Root file that handles instances of all the charts, image analyzer and loads the visualization
 */
(function () {
    var instance = null;

    // console.oldLog = console.log;
    // console.log = function(){
    //     var str = "<br>$ ";
    //     for (var i=0; i < arguments.length; i++) {
    //         if (parseFloat(arguments[i])){
    //             str += '<span class="log-number">' + arguments[i] + '<span> ';
    //         }
    //         else {
    //             str += arguments[i] + ' ';
    //         }
    //     }
    //     var log = $('#log');
    //     log.append(str);
    //     log.scrollTop(log[0].scrollHeight);
    //     console.oldLog.apply(null, arguments);
    // };
    //
    // var logButton = $('.log-btn');
    // logButton.click(function () {
    //     var footer = $('footer');
    //     if (footer.hasClass('footer-collapsed')){
    //         footer.addClass('footer-expanded').removeClass('footer-collapsed');
    //         logButton.text('▼');
    //     }
    //     else if (footer.hasClass('footer-expanded')){
    //         footer.addClass('footer-collapsed').removeClass('footer-expanded');
    //         logButton.text('▲');
    //     }
    // });

    function UpdateRenderCanvas(data) {
        let canvas = d3.select('#renderCanvas');
        console.log(data);

        canvas.attr('width', data.width);
        canvas.attr('height', data.height);

        let context = canvas.node().getContext("2d");

        let imgData = context.createImageData(data.width, data.height);

        let imgSize = data.width * data.height;

        for (var i = 0; i < imgSize; i++) {
            imgData.data[4 * i + 0] = data.data_r[i] * 255;
            imgData.data[4 * i + 1] = data.data_g[i] * 255;
            imgData.data[4 * i + 2] = data.data_b[i] * 255;
            imgData.data[4 * i + 3] = 255;
        }

        //console.log(imgData)

        context.putImageData(imgData, 0, 0);
        //         console.log($('#renderCanvas'));
        //         $('#render-image').attr('src', document.getElementById('renderCanvas').toDataURL('image/jpeg'));
    }

    function GetPixelSampleValue(i, j) {
        let results = [];

        var query = {
            "pixel_i": i,
            "pixel_j": j
        };

        var send_data = {
            "query_string": JSON.stringify(query)
        };

        $.ajax({
            type: "GET"
                //type: "POST"
                //crossDomain : true,
                //cache: false,
                //url: database_URI + '/getFromCollection/Cameras',
                ,
            url: database_URI + '/getFromCollection/OriginalCameraPaths'
                //data: data,
                ,
            success: function (data, textStatus, jqXHR) {
                console.log(textStatus)
                console.log(data)



            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
                console.log(jqXHR);
                console.log(errorThrown);
            }

            // The query.
            //, data: query

            ,
            data: send_data

            //, dataType: "json"
            //dataType: dataType
        });


    }

    function GetRenderIteration(iteration) {
        var query = {
            "renderIteration": iteration
        };

        var send_data = {
            "query_string": JSON.stringify(query)
        };

        $.ajax({
            type: "GET"
                //type: "POST"
                //crossDomain : true,
                //cache: false,
                //url: database_URI + '/getFromCollection/Cameras',
                ,
            url: database_URI + '/getFromCollection/ImageIterations'
                //data: data,
                ,
            success: function (data, textStatus, jqXHR) {
                //console.log(textStatus);
                //console.log(data);
                UpdateRenderCanvas(data[0]);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
                console.log(jqXHR);
                console.log(errorThrown);
            }

            // The query.
            //, data: query

            ,
            data: send_data

            //, dataType: "json"
            //dataType: dataType
        });
    }

    /**
     * Creates instances for image analyzer and every chart;
     * the classes are defined in the respective javascript files.
     */
    function init() {

        //GetRenderIteration(2);



        //Creating instances for each visualization
        var pathsChart = new PathsChart();
        var samplesChart = new SamplesChart(pathsChart);

        console.log('Requested the GALLERY json.')
            // Get the render gallery and load the image analyzer
        if (demo) {
            d3.json("data/renders.json", function (error, renders) {
                var imageAnalyzer = new ImageAnalyzer(samplesChart, pathsChart, renders);
                imageAnalyzer.update();
            });
        } else {
            d3.json("data/renders.json", function (error, renders) {
                var imageAnalyzer = new ImageAnalyzer(samplesChart, pathsChart, renders);
                imageAnalyzer.update();
            });
        }

    }

    /**
     *
     * @constructor
     */
    function Main() {
        if (instance !== null) {
            throw new Error("Cannot instantiate more than one Class");
        }
    }

    /**
     *
     * @returns {Main singleton class |*}
     */
    Main.getInstance = function () {
        var self = this;
        if (self.instance == null) {
            self.instance = new Main();

            //called only once when the class is initialized
            init();
        }
        return instance;
    };

    Main.getInstance();
})();