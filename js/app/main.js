var demo = true;
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


    /**
     * Creates instances for image analyzer and every chart;
     * the classes are defined in the respective javascript files.
     */
    function init() {
        //Creating instances for each visualization
        var pathsChart = new PathsChart();
        var samplesChart = new SamplesChart(pathsChart);


        // Get the render gallery and load the image analyzer
        if (demo){
            d3.json("data/renders.json", function (error, renders) {
                var imageAnalyzer = new ImageAnalyzer(samplesChart, pathsChart, renders);
                imageAnalyzer.update();
            });
        }
        else {
            d3.json("REQUESTP_ORTAL", function (error, renders) {
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

