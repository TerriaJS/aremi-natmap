#
# This little filter is for the 'jq' command line tool, and turns pre-refactor
# init_*.json files into the post-refactor style JSON.
#
# It's a work in progress, and only really deals with the AREMI specific data,
# but may be useful as a base for extension.
#
# To do the conversion, run something like the following command line:
#
# cat public/init_aremi.json | jq -f old2new_init.jq | grep -v '"legendUrl": null,' > output.json
#

{
  corsDomains : [
      "data.gov.au",
      "ga.gov.au",
      "corsproxy.com",
      "programs.communications.gov.au"
  ],
  camera: {
      "west": 105,
      "south": -45,
      "east": 155,
      "north": -5
  },
  services: [],
  catalog: [

    # for each major catalog
    .Layer[] | {
      name: .name,
      type: "group",
      items: [

        # for each category
        .Layer[] | {
          name: .name,
          type: "group",

          items: [
            # for each layer in this category
            .Layer[] | {
              name: .Title,
              layers: .Name,
              description: .description,

              # can't figure out a way of only printing legendUrl only when one
              # is present, so we just grep out '"legendUrl": null,' in post
              legendUrl: .legendUrl,
              # this is what we want to do but isn't valid syntax
              #(if (.legendUrl | length) > 0 then
              #  legendUrl: .legendUrl,
              #end)

              dataCustodian: .dataCustodian,
              url: .base_url,

              type: (if .type == "WMS" then
                "wms"
              else
                .type
              end),

              rectangle: .BoundingBox | [
                .west,
                .south,
                .east,
                .north
              ]
            }
          ]
        }
      ]
    }
  ]
}
