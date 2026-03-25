<?php

namespace Azuriom\Http\Controllers;

use Illuminate\Http\Request;

class MapController extends Controller
{
    public function show()
    {
        // Повертаєш Blade-шаблон з картою
        return view('map.show');
    }
}
