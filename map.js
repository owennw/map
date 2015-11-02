var mapper = function() {

    var width = 1600,
        height = 900,
        projection = null,
        includeGraticule = null,
        includeTooltip = null,
        pointRadius = 0;

    function map(selection) {
        selection.each(function(data, index) {
            var container = this,
                mouse = null,
                rotation = null;

            var path = d3.geo.path().projection(projection).pointRadius(pointRadius),
                globe = container.append('g');

            var dataParser = parser(data, globe);
            renderOcean(globe, path);
            renderCountries(dataParser, path);
            renderCities(dataParser, path, globe, projection);

            if (includeGraticule) {
                globe.append('path')
                    .datum(d3.geo.graticule())
                    .attr('class', 'graticule')
                    .attr('d', path);
            }

            function renderOcean(globe, path) {
                var id = 'ocean';

                var ocean = globe.append('defs').append('radialGradient')
                    .attr('id', id)
                    .attr('cx', '35%')
                    .attr('cy', '20%');
                ocean.append('stop')
                    .attr({
                        'offset': '5%',
                        'stop-color': '#def'
                    });
                ocean.append("stop")
                    .attr({
                        'offset': '100%',
                        'stop-color': "#9ac"
                    });

                globe.append('path')
                    .datum({ type: 'Sphere' })
                    .attr('d', path)
                    .style('fill', 'url(#' + id + ')');
            }

            function renderCountries(parser, path) {
                var displayCountries = parser('countries_110', 'land');
                displayCountries.enter()
                    .append('path')
                    .attr('d', path)
                    .attr('class', 'country');

                if (includeTooltip) {
                    var tooltip = d3.select('body').append('div').attr('class', 'tooltip');
                    displayCountries
                        .on('mouseover', function(d) {
                            tooltip.text(d.properties.name)
                                .style('display', 'block')
                                .style('opacity', 1);
                        })
                        .on('mouseout', function(d) {
                            tooltip
                                .style('display', 'none')
                                .style('opacity', 0);
                        })
                        .on('mousemove', function(d) {
                            tooltip
                                .style('left', (d3.event.pageX + 9) + 'px')
                                .style('top', (d3.event.pageY - 20) + 'px');
                        });
                }
            }

            function renderCities(parser, path, globe, projection) {
                var displayCapitals = parser('cities_110', 'city');
                var capitalGroups = displayCapitals.enter().append('g');

                capitalGroups.append('path')
                    .attr('d', path)
                    .attr('class', 'city');
                capitalGroups.append('text')
                    .attr('class', 'city-label')
                positionLabels(globe, projection);
            }

            function positionLabels(globe, projection) {
                globe.selectAll('.city-label')
                    .attr('transform', function(d) {
                        var coords = projection(d.geometry.coordinates);
                        return 'translate(' + coords[0] + ',' + coords[1] + ')';
                    })
                    .attr('text-anchor', function(d) {
                        // Specifies where the city text is in relation to its point
                        // map left -> text left
                        // map middle - text middle
                        // map right -> text right
                        var x = projection(d.geometry.coordinates)[0];
                        return x < width / 2 - 100 ? 'end' :
                            x < width / 2 + 100 ? 'middle' :
                            'start';
                    })
                    .style('display', function(d) {
                        // Prevents the cities not visible on the globe from appearing
                        var centerPos = projection.invert([width / 2, height / 2]);
                        var arc = d3.geo.greatArc();
                        var d = arc.distance({ source: d.geometry.coordinates, target: centerPos });

                        // 1.57 is ~ half of pi
                        return (d > 1.57) ? 'none' : 'inline';
                    })
                    .text(function(d) { return d.properties.name; });
            }

            function refresh(projection, path) {
                container.selectAll('.country').attr('d', path);
                container.selectAll('.city').attr('d', path);
                container.selectAll('.graticule').attr('d', path);
                positionLabels(globe, projection);
            }

            setInterval(function() {
                // Stop rotating if the mouse is held down
                if (mouse === null) {
                    rotation = projection.rotate();
                    rotation = [rotation[0] + 0.5, rotation[1], rotation[2]];
                    projection.rotate(rotation);
                    refresh(projection, path);
                }
            }, 45);

            function parser(data, globe) {
                return function(fieldName, selectionName) {
                    var items = topojson.feature(data, data.objects[fieldName]);
                    var displayItems = globe.selectAll(selectionName).data(items.features);

                    return displayItems;
                }
            }

            d3.select(window)
                .on('mousedown', mousedown)
                .on('mousemove', mousemove)
                .on('mouseup', mouseup);

            function mousedown(e) {
                globe.classed('drag', true);
                mouse = [d3.event.pageX, d3.event.pageY];
                rotation = projection.rotate();
                d3.event.preventDefault();
            }

            function mousemove(e) {
                if (mouse) {
                    var mouse2 = [d3.event.pageX, d3.event.pageY],
                        yaw = mouse2[0] - mouse[0],
                        pitch = rotation[1] - (mouse2[1] - mouse[1]) / 6;

                    if (pitch > 30) {
                        pitch = 30;
                    } else if (pitch < -30) {
                        pitch = -30;
                    }

                    projection.rotate([rotation[0] + yaw / 6, pitch, rotation[2]]);
                    refresh(projection, path);
                }
            }

            function mouseup(e) {
                globe.classed('drag', false);
                mouse = null;
                rotation = null;
            }
        })
    };

    map.projection = function(p) {
        if (!arguments.length) {
            return projection;
        }
        projection = p;
        return map;
    }

    map.graticule = function() {
        includeGraticule = true;
        return map;
    }

    map.pointRadius = function(radius) {
        if (!arguments.length) {
            return pointRadius;
        }
        pointRadius = radius;
        return map;
    }

    map.tooltip = function() {
        includeTooltip = true;
        return map;
    }

    map.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = value;
        return map;
    }

    map.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value;
        return map;
    }

    return map;
};


(function() {
    var width = 1600,
        height = 900,
        svg = d3.select('body').append('svg')
            .attr('width', width)
            .attr('height', height);

    d3.json('world_110.json', function(error, data) {
        if (error) {
            return console.error(error);
        }

        var axialTilt = -23.4,
            scale = 400,
            projection = d3.geo.orthographic()
                .scale(scale)
                .clipAngle(90)
                .rotate([-60, 0, axialTilt]) // yaw, pitch, roll
                .translate([width / 2, height / 2]),
            map = mapper()
                .projection(projection)
                .pointRadius(1.5)
                .tooltip()
                .graticule();

        placeShadow(scale, 880, 835);

        d3.select(svg)
            .datum(data)
            .call(map);
    });

    function placeShadow(scale, cx, cy) {
        var id = 'shadow',
            shadow = svg.append('defs').append('radialGradient')
                .attr({
                    'id': id,
                    'cx': '50%',
                    'cy': '50%'
                });

        shadow.append('stop')
            .attr({
                'offset': '10%',
                'stop-color': '#aaa',
                'stop-opacity': '0.89'
            });
        shadow.append('stop')
            .attr({
                'offset': '100%',
                'stop-color': '#777',
                'stop-opacity': '0'
            });

        svg.append('ellipse')
            .attr({
                'cx': cx,
                'cy': cy,
                'rx': scale * .80,
                'ry': scale * .20,
                'stroke-width': 0
            })
            .style('fill', 'url(#' + id + ')');
    }
}());
