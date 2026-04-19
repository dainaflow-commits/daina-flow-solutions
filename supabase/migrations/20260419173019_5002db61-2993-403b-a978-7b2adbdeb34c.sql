CREATE OR REPLACE FUNCTION public.slugify(v text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(
    lower(translate(v,
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüçñÑ',
      'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuucnN'
    )),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;