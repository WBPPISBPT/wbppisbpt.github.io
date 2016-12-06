var demo = false;
var server = "data/";
var serverSend = "";
var rendersQuery = '';
var isFrozen = false;
var userModificationsDefault = {
    removedSamples: {},
    eliminatedPaths: {}
};
var userModifications = {
    removedSamples: {},
    eliminatedPaths: {}
};

function setPopover(element, options) {
    if (element.nodes) {
        $(element.nodes()).each(function () {
            if ($(this).data('bs.popover')) {
                $(this).data('bs.popover').options.title = options.title;
                $(this).data('bs.popover').options.content = options.content;
            }
            else {
                $(this).attr('data-toggle', 'popover');
                $(this).popover(options);
            }
        });
    }
    else {
        if (element.data('bs.popover')) {
            element.data('bs.popover').options.title = options.title;
            element.data('bs.popover').options.content = options.content;
        }
        else {
            element.attr('data-toggle', 'popover');
            element.popover(options);
        }
    }
};

function updateServerReconstructionRequest() {
    if (Object.keys(userModifications.eliminatedPaths).length == 0 && Object.keys(userModifications.removedSamples).length == 0){
        $('#send-to-server').fadeOut(350, 'linear');
    }
    else{
        $('#send-to-server').fadeIn(350, 'linear');
    }

    var samplesHTML = '';
    var pathsHTML = '';

    var s = userModifications.removedSamples;
    var p = userModifications.eliminatedPaths;
    console.log(userModifications.eliminatedPaths)
    for (var key in s) {
        if (s.hasOwnProperty(key)) {
            for (var subKey in s[key]) {
                if (s[key].hasOwnProperty(subKey)) {
                    samplesHTML = samplesHTML + s[key][subKey][sampleUIDKey] + '<br>';
                }
            }
        }
    }

    for (var key in p) {
        if (p.hasOwnProperty(key)) {
            pathsHTML = pathsHTML + p[key] + '<br>';
        }
    }

    $('#sample-recont-cmd').html(samplesHTML);
    $('#path-recont-cmd').html(pathsHTML);
}

$('.close-img').on('click', function () {
   $('.about').fadeOut(350, 'linear');
});

$('.about').on('click', function () {
   $('.about').fadeOut(350, 'linear');
});

$('.open-about').on('click', function () {
    $('.about').fadeIn(350, 'linear');
});

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

        $(function () {
            $('[data-toggle="popover"]')
                .popover({
                    'placement': 'auto top',
                    'trigger': 'hover'
                })
                .on('inserted.bs.popover', function (e) {

                })
        });


        // Get the render gallery and load the image analyzer
        if (demo) {
            d3.json("data/renders.json", function (error, renders) {
                var imageAnalyzer = new ImageAnalyzer(samplesChart, pathsChart, renders);
                imageAnalyzer.update();
            });
        }
        else {
            d3.json(server + rendersQuery + 'renders.json', function (error, renders) {
                var imageAnalyzer = new ImageAnalyzer(samplesChart, pathsChart, renders);
                imageAnalyzer.update();
            });
        }

        $('#send-to-server').on('click', function () {
            if (Object.keys(userModifications.eliminatedPaths).length == 0 && Object.keys(userModifications.removedSamples).length == 0){
                Confirm.show('No Adjustments Made', 'You have no made any modifications to be sent to server.');
            }
            else if (serverSend == "")
                Confirm.show('Server Not Found', 'Unfortunately we were unable to contact the server!');
            else {
                // Send info to server
            }
        });
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

$(document).ready(function() {
    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
});

