(function() {
    var width = 1600,
        height = 900;

    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);

    d3.json('world.json', function(error, world) {
        if (error) {
            return console.error(error);
        }

        var subunits = topojson.feature(world, world.objects.subunits),
            projection = d3.geo.orthographic()
                .scale(300)
                .translate([width / 2, height / 2])
                .rotate([0, 0, -23.4]); // yaw, pitch, roll

        svg.append('path')
            .datum(subunits)
            .attr('d', d3.geo.path().projection(projection));
    })
}());
