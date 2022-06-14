// const renderMathjaxAsPNG = ($html, renderConfig) => {
//     return $q(function(resolve, reject) {
//         if (typeof $html != 'object' || !$html.html) {
//             $html = $('<div>' + $html + '</div>');
//         }

//         renderConfig = renderConfig ? renderConfig : {};
//         //our container is such: <div class="equation-container" data-eq="2^3=y"></div>
//         renderConfig.mathContainer = renderConfig.mathContainer ? renderConfig.mathContainer : '.equation-container';
//         renderConfig.mathDataAttr = renderConfig.mathDataAttr ? renderConfig.mathDataAttr : 'data-eq';
//         var $mathJaxElements = $html.find(renderConfig.mathContainer);
//         var currentReturn = 0;
//         var numberOfReturns = $mathJaxElements.length;

//         if (numberOfReturns == 0) {
//             return resolve($html.html());
//         }
//         for (var i = 0; i < numberOfReturns; i++) {
//             var $mathjaxElement = $($mathJaxElements[i]),
//                 mathContent = decodeURIComponent($mathjaxElement.attr(renderConfig.mathDataAttr)); //this is the "2^3=y"

//             renderMathjax(mathContent, $mathjaxElement)
//                 .then(
//                     function(result) {
//                         result.element.replaceWith(result.imgHtml);
//                     },
//                     function(err) {
//                         console.log(err);
//                     }
//                 )
//                 .finally(function() {
//                     if (++currentReturn >= numberOfReturns) {
//                         resolve($html.html());
//                     }
//                 });
//         }
//     });
// };

export const renderMathjax = (mathContent: any) => {
    return new Promise((resolve, reject) => {
        // const MathJax = window.Mathjax;

        console.log('Math Content', mathContent);

        var wrapper: any = document.createElement('div');
        wrapper.style.fontSize = '400%'; //may not need this
        wrapper.style['text-rendering'] = 'optimizeLegibility';
        wrapper.innerHTML = '\\[' + mathContent + '\\]';

        console.log('Wrapper', wrapper);

        const MathJax = window.MathJax;

        MathJax.Hub.Queue(['Typeset', MathJax.Hub, wrapper]);
        MathJax.Hub.Queue(function renderMathjaxToImg() {
            try {
                //start the conversion from svg to a base64 image source
                var mathjaxSVG = wrapper.getElementsByTagName('svg')[0];

                var svg = new XMLSerializer().serializeToString(mathjaxSVG);

                // Fetch Width for SVG
                const splitWidth = svg.split('width=')[1];

                const widthInEx = splitWidth.split('"')[1];

                const widthInNumber = widthInEx.split('ex')[0];

                const parseWidth = parseFloat(widthInNumber);

                //modify the svg for safari and IE/Edge for proper rendering
                svg = svg.replace('xmlns:NS1=""', 'xmlns:xlink="http://www.w3.org/1999/xlink"');
                svg = svg.replace('NS1:xmlns:xlink="http://www.w3.org/1999/xlink"', '');
                var imgSrc = 'data:image/svg+xml;base64,' + window.btoa(unescape(svg));
                return resolve({
                    // element: $mathjaxElement,
                    imgHtml: '<img src="' + imgSrc + '"></img>',
                    imgSrc: imgSrc,
                    intrinsicWidth: (parseWidth * 8.1).toFixed(2),
                });
            } catch (ex) {
                reject(ex);
            }
        });
    });
};

// const renderMathjax = (mathContent, $mathjaxElement) => {
//     return $q(function(resolve, reject) {
//         var wrapper = document.createElement('div');
//         wrapper.style.fontSize = '400%'; //may not need this
//         wrapper.style['text-rendering'] = 'optimizeLegibility';
//         wrapper.innerHTML = '\\[' + mathContent + '\\]';

//         //let mathjax do its thing and make the svg
//         mathjax.Hub.Queue(['Typeset', MathJax.Hub, wrapper]);
//         mathjax.Hub.Queue(function renderMathjaxToImg() {
//             try {
//                 //start the conversion from svg to a base64 image source
//                 var mathjaxSVG = wrapper.getElementsByTagName('svg')[0];
//                 var svg = new XMLSerializer().serializeToString(mathjaxSVG);
//                 var image = new Image();
//                 var canvas = document.createElement('canvas');

//                 var mycanvas = document.createElement('canvas');

//                 //modify the svg for safari and IE/Edge for proper rendering
//                 svg = svg.replace('xmlns:NS1=""', 'xmlns:xlink="http://www.w3.org/1999/xlink"');
//                 svg = svg.replace('NS1:xmlns:xlink="http://www.w3.org/1999/xlink"', '');
//                 var imgSrc = 'data:image/svg+xml;base64,' + window.btoa(svg);
//                 return resolve({
//                     element: $mathjaxElement,
//                     imgHtml: '<img src="' + imgSrc + '"></img>',
//                     imgSrc: imgSrc
//                 });
//             } catch (ex) {
//                 reject(ex);
//             }
//         });
//     });
// };

// const service = {
//     renderMathjaxAsPNG: renderMathjaxAsPNG,
//     renderMathjax: renderMathjax
// };

// return service;
