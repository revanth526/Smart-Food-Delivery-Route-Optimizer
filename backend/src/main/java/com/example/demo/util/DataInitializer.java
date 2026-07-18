package com.example.demo.util;

import com.example.demo.model.MenuItem;
import com.example.demo.model.Restaurant;
import com.example.demo.repository.MenuItemRepository;
import com.example.demo.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Override
    public void run(String... args) throws Exception {
        if (restaurantRepository.count() > 0) {
            return; // Database already seeded
        }

        // 1. Create Restaurants
        Restaurant r1 = new Restaurant(
                "Pizza Hub",
                "Road No 36, Jubilee Hills",
                4.5f,
                17.4483,
                78.3915
        );

        Restaurant r2 = new Restaurant(
                "Burger King",
                "Ameerpet Road",
                4.2f,
                17.4375,
                78.4483
        );

        Restaurant r3 = new Restaurant(
                "Noodles Point",
                "Kavuri Hills, Madhapur",
                4.0f,
                17.4436,
                78.3792
        );

        restaurantRepository.saveAll(Arrays.asList(r1, r2, r3));

        // 2. Create Menu Items
        // Pizza Hub Menu
        menuItemRepository.save(new MenuItem(r1, "Veg Pizza", 250.0));
        menuItemRepository.save(new MenuItem(r1, "Cheese Pizza", 300.0));
        menuItemRepository.save(new MenuItem(r1, "Garlic Bread", 120.0));

        // Burger King Menu
        menuItemRepository.save(new MenuItem(r2, "Whopper Burger", 190.0));
        menuItemRepository.save(new MenuItem(r2, "French Fries", 90.0));
        menuItemRepository.save(new MenuItem(r2, "Onion Rings", 110.0));

        // Noodles Point Menu
        menuItemRepository.save(new MenuItem(r3, "Hakka Noodles", 150.0));
        menuItemRepository.save(new MenuItem(r3, "Schezwan Noodles", 170.0));
        menuItemRepository.save(new MenuItem(r3, "Spring Rolls", 100.0));

        System.out.println("--- Database Seeded Successfully ---");
    }
}
